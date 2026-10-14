import React, { useState } from 'react';
import {
  Scale,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileQuestion,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useThemeAndLang } from '../contexts/ThemeAndLangContext.tsx';
import { IScenarioAnalysis } from '../types.ts';

interface ScenarioAnalyzerPageProps {
  onNavigateReporting: () => void;
}

export const ScenarioAnalyzerPage: React.FC<ScenarioAnalyzerPageProps> = ({
  onNavigateReporting,
}) => {
  const { language } = useThemeAndLang();
  const [scenarioText, setScenarioText] = useState('');
  const [analysis, setAnalysis] = useState<IScenarioAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleScenarios = [
    {
      label: 'Vendor Gift During RFP',
      text: 'A commercial IT vendor submitting a bid for our university tender sent two VIP sporting tickets (valued at $300) to my office desk before the contract decision.',
    },
    {
      label: 'Unauthorized AI Assignment Collaboration',
      text: 'My lab partner generated our entire computer science group project code and report using an unapproved LLM without disclosing it to the professor or citing it.',
    },
    {
      label: 'Suspected Workplace Retaliation',
      text: 'After I privately notified HR that my supervisor made discriminatory comments about an intern, the supervisor suddenly reassigned me to unfavorable graveyard shifts and revoked my project lead role.',
    },
    {
      label: 'Unencrypted Student Data Storage',
      text: 'A department colleague copied sensitive student transcripts, personal addresses, and financial aid numbers to a personal personal USB stick to work over the weekend from home.',
    },
  ];

  const handleAnalyze = async (textToAnalyze?: string) => {
    const text = (textToAnalyze || scenarioText).trim();
    if (!text || text.length < 15) {
      setError('Please provide a descriptive scenario (at least 15 characters).');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await api.analyzeScenario(text, language);
      setAnalysis(res.analysis);
    } catch (err) {
      setError('Failed to analyze the situation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-2">
          <Scale className="h-4 w-4" />
          <span>Interactive Ethical Dilemma & Policy Evaluation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Ethical Scenario Analyzer
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
          Unsure how institutional policies apply to a real-world situation? Describe the circumstances
          objectively to receive an impartial analysis grounded in official policy rules, potential risks,
          safe consultation channels, and responsible next steps.
        </p>
      </div>

      {/* Input Box */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs mb-8">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
          Describe the Situation or Dilemma
        </label>
        <textarea
          rows={4}
          value={scenarioText}
          onChange={(e) => setScenarioText(e.target.value)}
          placeholder="e.g. 'A supervisor asked me to backdate a grant expense submission before fiscal year close...', or 'My friend used AI to write their entire midterm assignment...'"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 p-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden leading-relaxed"
        />

        {/* Quick Sample Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">Try sample dilemma:</span>
          {sampleScenarios.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setScenarioText(s.text);
                handleAnalyze(s.text);
              }}
              className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-2.5 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <span className="text-[11px] text-slate-400">
            Confidential evaluation · Queries are not submitted as formal complaints
          </span>
          <button
            onClick={() => handleAnalyze()}
            disabled={loading || !scenarioText.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>{loading ? 'Analyzing with Policy Evidence...' : 'Analyze Situation'}</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 animate-pulse mb-3">
            <Scale className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Matching institutional policies and assessing ethical implications...
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Formulating balanced guidance, policy risks, and safe consultation options.
          </p>
        </div>
      )}

      {/* Analysis Results Display */}
      {analysis && (
        <div className="space-y-6 text-xs sm:text-sm">
          {/* Issue Summary */}
          <div className="rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 p-6 shadow-xs">
            <div className="flex items-center gap-2 text-teal-900 dark:text-teal-300 font-bold text-xs uppercase tracking-wider mb-2">
              <FileQuestion className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>Ethical Tension & Issue Summary</span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {analysis.issueSummary}
            </p>
          </div>

          {/* Relevant Policies Grounding */}
          {analysis.relevantPolicies && analysis.relevantPolicies.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Applicable Institutional Policies</span>
              </h3>
              <div className="space-y-2">
                {analysis.relevantPolicies.map((pol, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 text-xs"
                  >
                    <div className="font-bold text-teal-700 dark:text-teal-300">{pol.policyTitle}</div>
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      {pol.sectionTitle}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 italic">{pol.guideline}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks & Recommended Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risks */}
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20 p-6 shadow-xs">
              <h3 className="font-bold text-rose-800 dark:text-rose-300 text-xs uppercase tracking-wider flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Potential Risks & Policy Consequences</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {analysis.potentialRisks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Steps */}
            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/20 p-6 shadow-xs">
              <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Recommended Responsible Actions</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {analysis.recommendedActions.map((act, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">{idx + 1}.</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Reporting & Alternative Resolutions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">
                Safe Reporting & Consultation Channels
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 mb-4">
                {analysis.reportingOptions.map((opt, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
                    <span>{opt}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onNavigateReporting}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                <span>Open Reporting Directory</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">
                Alternative Conflict Resolutions
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {analysis.alternativeResolutions.map((alt, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-teal-600 font-bold">•</span>
                    <span>{alt}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Policy vs General Guidance Distinction */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
            <span className="font-bold text-xs uppercase tracking-wider text-slate-500 block mb-1">
              Policy Mandate vs General Advice
            </span>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {analysis.policyVsGeneralDistinction}
            </p>
          </div>

          {/* Impartiality Disclaimer */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/30 p-4 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Impartiality Notice:</strong> {analysis.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
