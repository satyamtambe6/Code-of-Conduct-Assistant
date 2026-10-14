import { GoogleGenAI } from '@google/genai';
import { IPolicyChunk, IPolicyDocument } from '../types.ts';

// Server-side initialization following @google/genai guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function generateWithTimeout(params: any, timeoutMs = 9000) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  return Promise.race([
    ai.models.generateContent(params),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out')), timeoutMs)
    ),
  ]);
}

export interface RagRetrievalResult {
  chunk: IPolicyChunk;
  score: number;
}

// Semantic and keyword scoring for RAG chunk retrieval
export function scoreAndRankChunks(
  query: string,
  chunks: IPolicyChunk[],
  topK = 5
): RagRetrievalResult[] {
  const queryTokens = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const results: RagRetrievalResult[] = [];

  for (const chunk of chunks) {
    const textLower = chunk.content.toLowerCase();
    const titleLower = chunk.policyTitle.toLowerCase();
    const sectionLower = chunk.sectionTitle.toLowerCase();
    const categoryLower = chunk.category.toLowerCase();

    let score = 0;

    for (const token of queryTokens) {
      // Check section title matches (high weight)
      if (sectionLower.includes(token)) score += 8;
      // Check policy title matches
      if (titleLower.includes(token)) score += 6;
      // Check category matches
      if (categoryLower.includes(token)) score += 4;

      // Count term occurrences in body text
      const regex = new RegExp(`\\b${token}\\b`, 'g');
      const matches = textLower.match(regex);
      if (matches) {
        score += Math.min(matches.length * 2, 10);
      } else if (textLower.includes(token)) {
        score += 1;
      }
    }

    // Boost exact phrase matching
    if (queryTokens.length > 1) {
      const phrase = queryTokens.join(' ');
      if (textLower.includes(phrase)) score += 15;
      if (sectionLower.includes(phrase)) score += 20;
    }

    if (score > 0) {
      results.push({ chunk, score });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topK);
}

export interface ChatAnswerResponse {
  answer: string;
  citations: {
    policyId: string;
    policyTitle: string;
    sectionTitle: string;
    snippet: string;
    pageNumber?: number;
  }[];
  isOfficialPolicy: boolean;
  followUpQuestions: string[];
}

export async function askPolicyRAG(
  question: string,
  allAvailableChunks: IPolicyChunk[],
  conversationHistory: { role: 'user' | 'assistant'; text: string }[] = [],
  language = 'en'
): Promise<ChatAnswerResponse> {
  const topChunks = scoreAndRankChunks(question, allAvailableChunks, 4);

  // If no chunks match at all, or score is extremely low, prepare grounded response
  const hasPolicyContext = topChunks.length > 0;

  const contextText = topChunks
    .map(
      (item, idx) =>
        `[Document: "${item.chunk.policyTitle}" | Section: "${item.chunk.sectionTitle}" | Page: ${item.chunk.pageNumber || 1}]\n${item.chunk.content}`
    )
    .join('\n\n---\n\n');

  const langInstruction =
    language === 'hi'
      ? 'Respond in clear, professional Hindi (हिंदी).'
      : language === 'mr'
      ? 'Respond in clear, professional Marathi (मराठी).'
      : 'Respond in clear, accessible English.';

  const systemInstruction = `You are the official "Code of Conduct Assistant" for the organization.
Your primary mission is to help students, employees, and staff understand official institutional policies, codes of conduct, workplace ethics, and compliance rules.

CORE COMPLIANCE RULES:
1. Ground your answers strictly in the provided official policy context whenever available.
2. NEVER invent policy rules, specific disciplinary penalties, suspension lengths, or official procedures that are not stated in the reference text.
3. If the provided reference documents DO NOT contain an answer or there is insufficient policy coverage, explicitly state:
   "The available official policy documents do not contain specific guidance regarding this question. Please reach out to your HR Department, Ethics & Compliance Officer, or Student Affairs for official determination."
4. Always clearly distinguish between official organizational policy requirements ("Under Policy Section X...") and general ethical advice.
5. In every official answer, explicitly name the policy document and section citation.
6. For serious allegations, workplace harassment, immediate safety threats, or illegal misconduct, clearly instruct the user on official reporting channels without attempting to judge guilt.
7. ${langInstruction}

FORMAT YOUR RESPONSE IN VALID JSON with the following structure:
{
  "answer": "Detailed, empathetic, professional answer with bullet points or paragraphs as appropriate.",
  "isOfficialPolicy": true (or false if information was absent from policy),
  "followUpQuestions": ["Follow up 1?", "Follow up 2?", "Follow up 3?"]
}
Only output valid JSON.`;

  const historyPrompt = conversationHistory
    .slice(-4)
    .map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`)
    .join('\n');

  const prompt = `REFERENCE POLICY CONTEXT:
${hasPolicyContext ? contextText : 'No matching policy documents found in the database for this query.'}

CONVERSATION HISTORY:
${historyPrompt || 'None'}

USER QUESTION:
${question}

Provide the JSON response following the instructions.`;

  try {
    const response = await generateWithTimeout({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);

    const citations = topChunks.map((item) => ({
      policyId: item.chunk.policyId,
      policyTitle: item.chunk.policyTitle,
      sectionTitle: item.chunk.sectionTitle,
      snippet: item.chunk.content.slice(0, 180) + '...',
      pageNumber: item.chunk.pageNumber,
    }));

    return {
      answer: parsed.answer || 'I could not process an answer based on current policies.',
      citations: parsed.isOfficialPolicy !== false ? citations : [],
      isOfficialPolicy: parsed.isOfficialPolicy ?? hasPolicyContext,
      followUpQuestions: Array.isArray(parsed.followUpQuestions)
        ? parsed.followUpQuestions
        : [
            'How can I officially report a concern?',
            'What protections exist against retaliation?',
            'Who is my designated compliance officer?',
          ],
    };
  } catch (error) {
    console.error('[Gemini API] RAG chat generation failed:', error);
    // Graceful fallback grounding
    if (hasPolicyContext) {
      return {
        answer: `According to **${topChunks[0].chunk.policyTitle}** (${topChunks[0].chunk.sectionTitle}):\n\n"${topChunks[0].chunk.content.slice(0, 300)}..."\n\nPlease refer to the official document for complete details or contact your compliance coordinator.`,
        citations: topChunks.map((item) => ({
          policyId: item.chunk.policyId,
          policyTitle: item.chunk.policyTitle,
          sectionTitle: item.chunk.sectionTitle,
          snippet: item.chunk.content.slice(0, 160) + '...',
          pageNumber: item.chunk.pageNumber,
        })),
        isOfficialPolicy: true,
        followUpQuestions: [
          'What is the procedure for reporting a violation?',
          'What are the key responsibilities under this policy?',
        ],
      };
    }

    return {
      answer:
        'The available official policy documents do not currently contain information on this topic. Please contact the Compliance Office or Human Resources for authoritative guidance.',
      citations: [],
      isOfficialPolicy: false,
      followUpQuestions: [
        'Where can I find the list of published policies?',
        'How do I contact the compliance hotline?',
      ],
    };
  }
}

export interface PolicyExplanationResult {
  summary: string;
  importantRules: string[];
  whatToDo: string[];
  whatToAvoid: string[];
  acceptableExamples: string[];
  unacceptableExamples: string[];
  relevantSections: string[];
  disclaimer: string;
}

export async function explainPolicy(
  policy: IPolicyDocument,
  language = 'en'
): Promise<PolicyExplanationResult> {
  const langInstruction =
    language === 'hi'
      ? 'Translate and explain in natural, clear Hindi (हिंदी).'
      : language === 'mr'
      ? 'Translate and explain in natural, clear Marathi (मराठी).'
      : 'Provide the explanation in clear, accessible English.';

  const prompt = `You are a compliance education expert. Provide a structured, simplified breakdown of this official policy document so that any student or employee can easily understand and abide by it.

POLICY TITLE: ${policy.title}
CATEGORY: ${policy.category}
CONTENT EXCERPT:
${policy.content.slice(0, 4500)}

INSTRUCTIONS:
${langInstruction}
Ensure the output is valid JSON matching this exact structure:
{
  "summary": "Clear, plain-language summary in 2-3 sentences.",
  "importantRules": ["Rule 1", "Rule 2", "Rule 3", "Rule 4"],
  "whatToDo": ["Action 1", "Action 2", "Action 3"],
  "whatToAvoid": ["Avoid 1", "Avoid 2", "Avoid 3"],
  "acceptableExamples": ["Real-world scenario of acceptable conduct 1", "Scenario 2"],
  "unacceptableExamples": ["Real-world scenario of unacceptable conduct 1", "Scenario 2"],
  "relevantSections": ["Section A: Name", "Section B: Name"],
  "disclaimer": "This explanation is a simplified summary intended for educational clarity. The official institutional policy text takes precedence in any compliance review or formal dispute."
}
Only output valid JSON.`;

  try {
    const response = await generateWithTimeout({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      summary: parsed.summary || 'Policy explanation summary.',
      importantRules: parsed.importantRules || ['Adhere to established conduct standards.'],
      whatToDo: parsed.whatToDo || ['Review policy requirements regularly.'],
      whatToAvoid: parsed.whatToAvoid || ['Avoid non-compliant behavior.'],
      acceptableExamples: parsed.acceptableExamples || ['Acting transparently.'],
      unacceptableExamples: parsed.unacceptableExamples || ['Concealing conflicts of interest.'],
      relevantSections: parsed.relevantSections || ['General Standards'],
      disclaimer:
        parsed.disclaimer ||
        'This explanation is a simplified summary. The official institutional policy text takes precedence.',
    };
  } catch (err) {
    console.error('Error generating policy explanation:', err);
    return {
      summary: `${policy.title} sets forth standards for ${policy.category}. All members are expected to comply with its provisions.`,
      importantRules: [
        'Read and familiarize yourself with the full document text.',
        'Act with integrity, fairness, and accountability.',
        'Report potential infractions through authorized reporting procedures.',
      ],
      whatToDo: ['Maintain honest documentation.', 'Consult with designated supervisors when unsure.'],
      whatToAvoid: ['Disregarding policy regulations.', 'Retaliating against individuals reporting concerns.'],
      acceptableExamples: ['Promptly disclosing external engagements or potential conflicts.'],
      unacceptableExamples: ['Using institutional assets for unauthorized personal gain.'],
      relevantSections: ['Scope and Applicability', 'Standards of Conduct', 'Reporting Mechanisms'],
      disclaimer:
        'This explanation is a simplified interpretation for educational purposes. The official policy document takes precedence.',
    };
  }
}

export interface ScenarioAnalysisResult {
  issueSummary: string;
  relevantPolicies: {
    policyTitle: string;
    sectionTitle: string;
    guideline: string;
  }[];
  potentialRisks: string[];
  recommendedActions: string[];
  reportingOptions: string[];
  alternativeResolutions: string[];
  policyVsGeneralDistinction: string;
  disclaimer: string;
}

export async function analyzeScenario(
  scenarioDescription: string,
  allAvailableChunks: IPolicyChunk[],
  language = 'en'
): Promise<ScenarioAnalysisResult> {
  const topChunks = scoreAndRankChunks(scenarioDescription, allAvailableChunks, 4);
  const context = topChunks
    .map(
      (c) =>
        `[Policy: ${c.chunk.policyTitle} | Section: ${c.chunk.sectionTitle}]\n${c.chunk.content}`
    )
    .join('\n\n---\n\n');

  const langInstruction =
    language === 'hi'
      ? 'Output analysis in Hindi (हिंदी).'
      : language === 'mr'
      ? 'Output analysis in Marathi (मराठी).'
      : 'Output analysis in English.';

  const prompt = `You are an institutional ethics advisor.
A user has submitted the following workplace or academic dilemma for scenario analysis:

SCENARIO DESCRIPTION:
"${scenarioDescription}"

OFFICIAL POLICY EVIDENCE:
${context || 'No specific policy chunk matches this exact scenario.'}

INSTRUCTIONS:
1. Provide an objective, balanced analysis. DO NOT declare anyone guilty, accuse individuals of crimes, or make final disciplinary rulings.
2. Ground conclusions in the cited policies where applicable.
3. Clearly distinguish between official organizational rules vs general ethical recommendations.
4. ${langInstruction}

Format response in valid JSON matching this structure:
{
  "issueSummary": "Concise summary of the core ethical tension and dilemma.",
  "relevantPolicies": [
    {
      "policyTitle": "Title",
      "sectionTitle": "Section",
      "guideline": "Direct policy principle"
    }
  ],
  "potentialRisks": ["Risk 1", "Risk 2", "Risk 3"],
  "recommendedActions": ["Step 1", "Step 2", "Step 3"],
  "reportingOptions": ["Confidential Ombudsperson", "HR Ethics Hotline", "Advisor Consultation"],
  "alternativeResolutions": ["Direct informal conversation if safe", "Mediation via supervisor"],
  "policyVsGeneralDistinction": "Clear statement distinguishing what is explicitly required by policy versus general good judgment.",
  "disclaimer": "This analysis provides educational guidance and is not a formal legal or disciplinary determination. Official reporting channels should be used for investigation."
}
Only output valid JSON.`;

  try {
    const res = await generateWithTimeout({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(res.text || '{}');
    return {
      issueSummary: parsed.issueSummary || 'Ethical scenario submitted for review.',
      relevantPolicies: parsed.relevantPolicies || [],
      potentialRisks: parsed.potentialRisks || ['Breach of organizational standards', 'Reputational risk'],
      recommendedActions:
        parsed.recommendedActions || ['Document details', 'Consult an authorized advisor'],
      reportingOptions:
        parsed.reportingOptions || ['Institutional Ethics Hotline', 'Human Resources Compliance'],
      alternativeResolutions:
        parsed.alternativeResolutions || ['Constructive direct dialogue if appropriate'],
      policyVsGeneralDistinction:
        parsed.policyVsGeneralDistinction ||
        'Specific reporting duties stem from institutional policy; constructive communication is an ethical best practice.',
      disclaimer:
        parsed.disclaimer ||
        'This analysis provides educational guidance and does not replace official compliance investigations.',
    };
  } catch (err) {
    console.error('Scenario analysis error:', err);
    return {
      issueSummary: 'The scenario involves a potential conflict with institutional standards and ethics.',
      relevantPolicies: topChunks.map((c) => ({
        policyTitle: c.chunk.policyTitle,
        sectionTitle: c.chunk.sectionTitle,
        guideline: c.chunk.content.slice(0, 150) + '...',
      })),
      potentialRisks: [
        'Potential violation of code of conduct',
        'Compromise of institutional integrity or trust',
      ],
      recommendedActions: [
        'Document the factual timeline and specific observations objectively.',
        'Review the relevant policy sections before taking action.',
        'Consult with a trusted supervisor, Ombudsperson, or compliance officer.',
      ],
      reportingOptions: [
        'Institutional Ethics & Compliance Office',
        'Confidential Employee/Student Assistance Program',
        'Official online reporting portal',
      ],
      alternativeResolutions: [
        'Seek clarification from a department head or faculty mentor.',
        'Engage in professional informal resolution if no harm or harassment is present.',
      ],
      policyVsGeneralDistinction:
        'Official policy mandates reporting for severe infractions; interpersonal differences can often be clarified through supervisor mediation.',
      disclaimer:
        'This analysis is for educational and advisory purposes and is not a formal adjudication of misconduct.',
    };
  }
}
