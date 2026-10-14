import { IUser, IPolicyDocument, IPolicyChunk } from '../types.ts';
import { hashPassword } from '../middleware/auth.ts';
import { chunkTextIntoSections } from '../services/documentParser.ts';

export async function getSeedUsers(): Promise<IUser[]> {
  const adminPassword = await hashPassword('admin123');
  const managerPassword = await hashPassword('manager123');
  const userPassword = await hashPassword('user123');

  return [
    {
      _id: 'usr_admin_01',
      name: 'Dr. Evelyn Vance',
      email: 'admin@conduct.org',
      passwordHash: adminPassword,
      role: 'admin',
      organization: 'Meridian Global Institute',
      department: 'Office of General Counsel & Compliance',
      createdAt: new Date('2026-01-15T08:00:00Z').toISOString(),
      updatedAt: new Date('2026-01-15T08:00:00Z').toISOString(),
    },
    {
      _id: 'usr_mgr_01',
      name: 'Marcus Sterling',
      email: 'manager@conduct.org',
      passwordHash: managerPassword,
      role: 'policy_manager',
      organization: 'Meridian Global Institute',
      department: 'Human Resources & Policy Governance',
      createdAt: new Date('2026-02-01T09:00:00Z').toISOString(),
      updatedAt: new Date('2026-02-01T09:00:00Z').toISOString(),
    },
    {
      _id: 'usr_std_01',
      name: 'Sarah Chen',
      email: 'user@conduct.org',
      passwordHash: userPassword,
      role: 'student_employee',
      organization: 'Meridian Global Institute',
      department: 'School of Computing / Staff Associate',
      createdAt: new Date('2026-02-10T10:00:00Z').toISOString(),
      updatedAt: new Date('2026-02-10T10:00:00Z').toISOString(),
    },
  ];
}

interface SeedPolicyDefinition {
  id: string;
  title: string;
  category: IPolicyDocument['category'];
  description: string;
  version: string;
  department: string;
  effectiveDate: string;
  tags: string[];
  rawText: string;
}

export const SEED_POLICIES_DEF: SeedPolicyDefinition[] = [
  {
    id: 'pol_workplace_01',
    title: 'Workplace Ethics & Professional Conduct Code',
    category: 'Workplace Ethics',
    description:
      'Foundational expectations for ethical behavior, mutual respect, professional communication, and honesty across all institutional operations.',
    version: '2026.1',
    department: 'People Operations & Integrity',
    effectiveDate: '2026-01-01',
    tags: ['ethics', 'workplace', 'integrity', 'professionalism', 'respect'],
    rawText: `MERIDIAN GLOBAL INSTITUTE
POLICY NUMBER: POL-ETH-2026-01
WORKPLACE ETHICS AND PROFESSIONAL CONDUCT CODE

SECTION 1. PURPOSE AND INSTITUTIONAL VALUES
All faculty, staff, administrators, and student employees are expected to uphold the highest standards of professional ethics, personal honesty, and civic responsibility. Our institution prioritizes transparency, accountability, and the dignity of every community member.

SECTION 2. STANDARDS OF PROFESSIONAL INTEGRITY
Employees must perform their duties diligently, accurately, and honestly. Falsification of records, timesheets, research findings, or expenditure reports constitutes gross misconduct and is grounds for immediate disciplinary action up to and including termination of employment.

SECTION 3. ACCEPTANCE OF GIFTS AND HOSPITALITY
Employees may not accept gifts, favors, entertainment, or financial gratuities from vendors, contractors, or students that could reasonably be perceived as influencing official decisions.
1. Token gifts valued under $25 (such as modest promotional pens, note pads, or shared office food) are permissible if infrequent.
2. Any gift, entertainment invitation, or vendor hospitality exceeding $25 in value must be formally reported to and approved by the Ethics and Compliance Officer.
3. Cash, gift cards, or securities in any amount are strictly prohibited under all circumstances.

SECTION 4. RESPECTFUL WORK ENVIRONMENT AND HARASSMENT PREVENTION
The institution maintains zero tolerance for verbal abuse, intimidation, derogatory slurs, or harassment based on race, sex, gender identity, disability, age, religion, or national origin. Superiors must never abuse their authority or demand personal favors from subordinates or students.

SECTION 5. REPORTING VIOLATIONS AND NON-RETALIATION GUARANTEE
Any community member who observes or reasonably suspects a violation of this code is encouraged to report it to their direct supervisor, the Department Head, or the Confidential Integrity Hotline.
1. The institution strictly prohibits retaliation in any form against an individual who reports an ethical concern in good faith.
2. Anyone engaging in retaliatory acts will be subject to severe disciplinary sanctions independent of the initial allegation outcome.
3. Good faith reports may be submitted anonymously through the online ethics intake portal.`,
  },
  {
    id: 'pol_academic_02',
    title: 'Academic Integrity and Student Honor Code',
    category: 'Academic Integrity',
    description:
      'Clear rules governing scholarship, examinations, proper citation, unauthorized collaboration, and permitted use of generative AI tools.',
    version: '2026.2',
    department: 'Academic Affairs & Faculty Senate',
    effectiveDate: '2026-01-15',
    tags: ['academic integrity', 'plagiarism', 'cheating', 'generative ai', 'exams'],
    rawText: `MERIDIAN GLOBAL INSTITUTE
POLICY NUMBER: POL-ACAD-2026-02
ACADEMIC INTEGRITY AND STUDENT HONOR CODE

SECTION 1. THE HONOR COMMITMENT
Academic excellence requires genuine intellectual effort. Every student agrees to submit work that represents their own authentic scholarship, analysis, and synthesis.

SECTION 2. DEFINITIONS OF ACADEMIC MISCONDUCT
1. Plagiarism: Representing the ideas, words, figures, or code of another creator as one's own without appropriate citation and attribution.
2. Examination Dishonesty: Using unauthorized materials, electronic devices, unauthorized notes, or receiving unauthorized aid during quizzes, midterms, or final examinations.
3. Unauthorized Collaboration: Working together on individual assignments, laboratory writeups, or problem sets without explicit instructor authorization.
4. Fabrication: Inventing data, sources, laboratory measurements, or citations.

SECTION 3. GUIDELINES ON GENERATIVE AI TOOLS
Generative AI assistants (including LLMs, code assistants, and automated text generators) may only be used when explicitly authorized in the instructor's syllabus or written assignment guidelines.
1. If permitted, students must clearly cite the tool, specify prompts used, and describe the extent of AI involvement.
2. Submitting AI-generated text, solutions, or code as entirely original work without disclosure is classified as academic fraud.
3. Instructors reserve the right to conduct oral defenses or unassisted assessments to verify authentic student mastery.

SECTION 4. DISCIPLINARY SANCTIONS AND HEARINGS
Violations are classified into Tier 1 (Minor/First Offense), Tier 2 (Substantial Infraction), and Tier 3 (Severe/Repeat Dishonesty).
1. Tier 1 infractions are resolved between student and instructor, typically resulting in a zero on the specific assignment and mandatory attendance at an academic ethics seminar.
2. Tier 2 and Tier 3 violations are referred to the Academic Integrity Board and may result in an F grade in the course, academic probation, suspension, or formal expulsion.
3. Students have the right to a fair hearing, presentation of evidence, and an appeal process within 10 business days of notification.`,
  },
  {
    id: 'pol_harassment_03',
    title: 'Anti-Harassment, Discrimination & Non-Retaliation Policy',
    category: 'Anti-Harassment',
    description:
      'Comprehensive institutional protocols for preventing discrimination, investigating sexual harassment, protecting whistleblowers, and supporting victims.',
    version: '2026.1',
    department: 'Office of Diversity, Equity & Compliance',
    effectiveDate: '2026-01-01',
    tags: ['harassment', 'discrimination', 'title ix', 'safety', 'whistleblower'],
    rawText: `MERIDIAN GLOBAL INSTITUTE
POLICY NUMBER: POL-HAR-2026-03
ANTI-HARASSMENT, DISCRIMINATION, AND NON-RETALIATION POLICY

SECTION 1. INSTITUTIONAL STATEMENT OF COMMITMENT
The Institute is committed to providing an educational, employment, and living environment free from all forms of unlawful discrimination, sexual harassment, sexual assault, stalking, and domestic abuse.

SECTION 2. DEFINITIONS OF PROHIBITED CONDUCT
1. Sexual Harassment: Unwelcome sexual advances, requests for sexual favors, and verbal or physical conduct of a sexual nature that creates an intimidating, hostile, or offensive working or learning environment.
2. Quid Pro Quo: Conditioning an academic grade, employment opportunity, promotion, or letter of recommendation on submission to romantic or sexual demands.
3. Discrimination: Unfavorable treatment based upon protected characteristics including race, color, religion, sex, sexual orientation, disability, pregnancy, or veteran status.

SECTION 3. REPORTING PROCEDURES AND CONFIDENTIALITY
1. Immediate Safety: In cases of physical threat, immediate assault, or emergency, contact Campus Police / Emergency Services immediately at 911 or (555) 0199.
2. Confidential Resources: Students and employees may speak confidentially to the Campus Counseling Center, Student Health Clinic, or the Ombudsperson without triggering a formal investigation.
3. Mandatory Reporters: All faculty members, academic advisors, and supervisors are designated Responsible Employees and must promptly report known instances of sexual misconduct to the Title IX Coordinator within 24 hours.

SECTION 4. INVESTIGATIVE PROCESS AND PROTECTIVE MEASURES
Upon receipt of a formal report:
1. The Title IX & Compliance Office assesses interim protective measures (such as no-contact orders, course schedule modifications, or temporary administrative leave).
2. An impartial, trained investigator conducts witness interviews and gathers physical or electronic evidence.
3. Both parties have equal access to advisors, written reports, and review periods before any disciplinary board hearing.

SECTION 5. STRICT PROHIBITION OF RETALIATION
The Institute will not tolerate threats, adverse employment consequences, academic penalties, or social harassment directed toward any complainant, witness, or investigator. Retaliation is treated as an independent severe violation resulting in termination or expulsion.`,
  },
  {
    id: 'pol_privacy_04',
    title: 'Data Privacy, Confidentiality & Cybersecurity Policy',
    category: 'Data Privacy',
    description:
      'Mandatory standards for protecting student records (FERPA), employee personal data, institutional intellectual property, and cybersecurity safeguards.',
    version: '2026.3',
    department: 'Information Security & Privacy Office',
    effectiveDate: '2026-02-01',
    tags: ['privacy', 'cybersecurity', 'confidentiality', 'ferpa', 'passwords', 'encryption'],
    rawText: `MERIDIAN GLOBAL INSTITUTE
POLICY NUMBER: POL-CYB-2026-04
DATA PRIVACY, CONFIDENTIALITY, AND CYBERSECURITY POLICY

SECTION 1. SCOPE AND CLASSIFICATION OF DATA
This policy applies to all electronic computing devices, networks, email systems, and databases. Data is classified into three levels:
1. Public Data: Information intended for unrestricted distribution.
2. Internal Data: Operational schedules, non-sensitive internal memos.
3. Restricted / Confidential Data: Personally Identifiable Information (PII), student academic transcripts, financial account numbers, medical records, and proprietary research data.

SECTION 2. ACCESS RESTRICTIONS AND FERPA COMPLIANCE
Under the Family Educational Rights and Privacy Act (FERPA) and institutional regulations, student educational records cannot be disclosed to external parties or non-instructional staff without explicit written student consent.
Employees may only access records necessary for their authorized job functions ("Need to Know" principle).

SECTION 3. PASSWORD AND AUTHENTICATION HYGIENE
1. Multi-factor authentication (MFA) is mandatory for all institutional accounts.
2. Passwords must never be shared, written on post-it notes, or sent via unencrypted email.
3. Accounts must use a minimum 12-character passphrase. Sharing administrative credentials will result in immediate revocation of access privileges.

SECTION 4. USE OF PERSONAL DEVICES AND STORAGE MEDIA
1. Restricted or Confidential Data must never be downloaded to unencrypted USB thumb drives or personal computers.
2. Institutional business must be conducted using official email accounts and approved encrypted cloud repositories.
3. In the event of a lost device containing institutional emails or documents, the employee must notify the Information Security Helpdesk within two hours.

SECTION 5. REPORTING DATA BREACHES
Anyone who detects a potential phishing attack, ransomware event, or accidental data disclosure must immediately notify security@meridian.org or call the 24/7 Security Operations Center.`,
  },
  {
    id: 'pol_conflict_05',
    title: 'Conflict of Interest and External Consulting Policy',
    category: 'Conflict of Interest',
    description:
      'Rules regarding external business relationships, consulting agreements, secondary employment, and procurement transparency.',
    version: '2026.1',
    department: 'Governance & Institutional Compliance',
    effectiveDate: '2026-01-01',
    tags: ['conflict of interest', 'consulting', 'procurement', 'secondary employment'],
    rawText: `MERIDIAN GLOBAL INSTITUTE
POLICY NUMBER: POL-COI-2026-05
CONFLICT OF INTEREST AND EXTERNAL CONSULTING POLICY

SECTION 1. POLICY STATEMENT
Employees have a fiduciary responsibility to act solely in the best interests of the Institute. Outside activities, financial investments, and secondary business ventures must not conflict with primary job obligations.

SECTION 2. MANDATORY DISCLOSURE OF FINANCIAL INTERESTS
Full-time faculty and staff must submit an annual Conflict of Interest Disclosure Form and update it within 30 days of any material change.
A reportable interest includes:
1. Financial equity or ownership exceeding 5% in a company doing business with the Institute.
2. Consulting fees or compensation from vendors who participate in institutional tenders.
3. Family members employed by or holding substantial ownership in institutional suppliers.

SECTION 3. PROCUREMENT RECUSAL
Any staff member who has a personal, familial, or financial relationship with a bidding vendor must recuse themselves entirely from evaluation committees, bidding decisions, and contract negotiations.

SECTION 4. OUTSIDE PROFESSIONAL ACTIVITIES AND CONSULTING
Faculty and senior staff may engage in external professional consulting up to a maximum of one day per working week (20% effort), provided such activities:
1. Do not interfere with scheduled lectures, advising, or departmental duties.
2. Do not utilize institutional laboratories, staff time, or proprietary software without an approved commercial facilities agreement.
3. Do not place the individual in direct competitive conflict with institutional grants.`,
  },
];

export async function seedInitialData(): Promise<void> {
  const { db } = await import('../db/database.ts');

  // Check if users already seeded
  const userCount = await db.users.count();
  if (userCount === 0) {
    console.log('[Seed] Seeding default administrative and user accounts...');
    const users = await getSeedUsers();
    for (const u of users) {
      await db.users.insertOne(u);
    }
  }

  // Check if policies already seeded
  const policyCount = await db.policies.count();
  if (policyCount === 0) {
    console.log('[Seed] Seeding foundational demonstration policy documents...');
    const allChunks: IPolicyChunk[] = [];

    for (const def of SEED_POLICIES_DEF) {
      const chunks = chunkTextIntoSections(def.rawText);

      const policyDoc: IPolicyDocument = {
        _id: def.id,
        title: def.title,
        category: def.category,
        description: def.description,
        documentType: 'TXT',
        fileName: `${def.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.txt`,
        fileSize: Buffer.byteLength(def.rawText, 'utf8'),
        content: def.rawText,
        version: def.version,
        status: 'published',
        publishedAt: new Date('2026-01-15T00:00:00Z').toISOString(),
        effectiveDate: def.effectiveDate,
        department: def.department,
        authorId: 'usr_admin_01',
        authorName: 'Dr. Evelyn Vance (Office of General Counsel)',
        tags: def.tags,
        chunksCount: chunks.length,
        createdAt: new Date('2026-01-15T00:00:00Z').toISOString(),
        updatedAt: new Date('2026-01-15T00:00:00Z').toISOString(),
      };

      await db.policies.insertOne(policyDoc);

      for (const ch of chunks) {
        allChunks.push({
          _id: `chk_${def.id}_${ch.chunkIndex}`,
          policyId: def.id,
          policyTitle: def.title,
          category: def.category,
          sectionTitle: ch.sectionTitle,
          content: ch.content,
          chunkIndex: ch.chunkIndex,
          pageNumber: ch.pageNumber,
          createdAt: new Date().toISOString(),
        });
      }
    }

    await db.chunks.insertMany(allChunks);
    console.log(`[Seed] Seeded ${SEED_POLICIES_DEF.length} policies with ${allChunks.length} searchable RAG chunks.`);
  }

  // Ensure default settings exist
  await db.settings.get();
}
