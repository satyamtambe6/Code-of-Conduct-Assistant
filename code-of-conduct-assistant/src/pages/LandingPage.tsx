import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  BookOpen,
  Scale,
  FileCheck2,
  Lock,
  ArrowRight,
  HelpCircle,
  Users,
  Compass,
  CheckCircle,
} from 'lucide-react';
import { useThemeAndLang } from '../contexts/ThemeAndLangContext.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { t } = useThemeAndLang();
  const { user } = useAuth();

  const features = [
    {
      icon: <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      title: 'Gemini-Powered Policy Q&A',
      description:
        'Ask real questions in plain language and receive precise, source-grounded answers with exact section and document citations.',
    },
    {
      icon: <Scale className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      title: 'Ethical Scenario Analyzer',
      description:
        'Walk through nuanced workplace dilemmas or academic integrity questions without fear. Receive balanced guidance and official reporting options.',
    },
    {
      icon: <BookOpen className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      title: 'Searchable Policy Library',
      description:
        'Access categorized, versioned, and authorized guidelines across workplace ethics, academic honesty, cybersecurity, and non-retaliation.',
    },
    {
      icon: <FileCheck2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      title: 'AI Policy Simplifier',
      description:
        'Transform complex, multi-page compliance documents into plain-language summaries highlighting what to do, what to avoid, and realistic examples.',
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      title: 'Strict Grounding & Zero Hallucination',
      description:
        'Strict RAG retrieval ensures the assistant never invents rules or penalties. If a policy is absent, it transparently directs you to compliance officers.',
    },
    {
      icon: <Lock className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      title: 'Enterprise Role-Based Access',
      description:
        'Granular permissions isolate student/employee consultations while empowering administrators with document publishing, audit logs, and metrics.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Official Document Extraction',
      description: 'Authorized administrators upload PDF or TXT policies. Text is extracted, parsed into semantic sections, and indexed for high-precision retrieval.',
    },
    {
      step: '02',
      title: 'Ask in Natural Language',
      description: 'Inquire about harassment protocols, gift limits, secondary employment, or generative AI use in assignments without legal jargon.',
    },
    {
      step: '03',
      title: 'RAG Retrieval & Citation',
      description: 'Our engine identifies the authoritative policy sections and passes them to Google Gemini to formulate an exact, grounded explanation with source links.',
    },
    {
      step: '04',
      title: 'Confident Decision Making',
      description: 'Take actionable next steps, initiate formal reporting through official portals if necessary, or verify compliance before acting.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-slate-50 via-white to-slate-50/50 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 dark:border-teal-800/80 bg-teal-50/80 dark:bg-teal-950/40 px-3 py-1 text-xs font-medium text-teal-800 dark:text-teal-300 mb-6">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
            <span>Enterprise Institutional Governance & AI Compliance</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl">
            Understand Your Code of Conduct.{' '}
            <span className="text-teal-600 dark:text-teal-400 block mt-2">
              Make Better Decisions.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            Empowering students, faculty, employees, and ethics officers with an intelligent,
            source-grounded assistant. Ask questions in natural language and receive trusted answers
            derived directly from official policy documents.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('chat')}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              <span>{t.askAI}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => onNavigate('policies')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-2xs"
            >
              <BookOpen className="h-4 w-4 text-slate-500" />
              <span>{t.explorePolicies}</span>
            </button>

            <button
              onClick={() => onNavigate('scenarios')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-2xs"
            >
              <Scale className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>{t.scenarioAnalyzer}</span>
            </button>
          </div>

          {/* Quick interactive sample questions */}
          <div className="mt-12 text-left max-w-2xl mx-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
              <HelpCircle className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Try asking questions like:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'What are the rules regarding workplace harassment?',
                'Can I accept a $50 gift card from a vendor?',
                'What are the rules on using generative AI in assignments?',
                'How do I report misconduct safely without retaliation?',
              ].map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate('chat')}
                  className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:border-teal-500 dark:hover:border-teal-500 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 transition-colors text-left"
                >
                  "{query}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-900 transition-colors">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-2">
              Institutional Capabilities
            </h2>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Engineered for Compliance, Clarity, and Confidence
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Transform static policy PDFs into interactive, trustworthy intelligence for your entire community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-6 hover:border-teal-500/40 transition-all hover:shadow-xs"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/60">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-slate-50 dark:bg-slate-950/70 border-y border-slate-200 dark:border-slate-800 transition-colors">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400 mb-2">
              Workflow
            </h2>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              How the Assistant Grounds Every Answer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st, idx) => (
              <div
                key={idx}
                className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs"
              >
                <div className="text-2xl font-black text-teal-600/30 dark:text-teal-400/20 mb-3 font-mono">
                  {st.step}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  {st.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {st.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy and Security Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-900 transition-colors">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 text-white p-8 md:p-12 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-medium text-teal-300 mb-4">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Confidentiality & Ethical Safety Standards</span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Guaranteed AI Compliance & Responsible Boundaries
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  The assistant operates strictly as an educational and policy reference tool. It does
                  not make disciplinary judgments, submit unauthorized reports, or speculate beyond
                  approved organizational policy documents.
                </p>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-400" />
                    <span>No invented rules or penalties</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-400" />
                    <span>Exact document & section citations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-400" />
                    <span>Encrypted user session data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-teal-400" />
                    <span>Official reporting channel directory</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full sm:w-auto">
                <button
                  onClick={() => onNavigate('reporting')}
                  className="rounded-lg bg-teal-500 hover:bg-teal-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition-colors shadow-sm"
                >
                  View Reporting Channels
                </button>
                <button
                  onClick={() => onNavigate('policies')}
                  className="rounded-lg border border-slate-700 hover:bg-slate-800 px-5 py-2.5 text-xs font-medium text-white transition-colors text-center"
                >
                  Browse Policy Catalog
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-600 text-white">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                Code of Conduct Assistant
              </span>
              <span className="text-xs text-slate-400">· Meridian Global Institute</span>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <button onClick={() => onNavigate('policies')} className="hover:text-slate-900 dark:hover:text-white">
                Policies
              </button>
              <button onClick={() => onNavigate('scenarios')} className="hover:text-slate-900 dark:hover:text-white">
                Scenario Analyzer
              </button>
              <button onClick={() => onNavigate('reporting')} className="hover:text-slate-900 dark:hover:text-white">
                Reporting
              </button>
              <button onClick={() => onNavigate('chat')} className="hover:text-slate-900 dark:hover:text-white">
                AI Assistant
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 text-center text-[11px] text-slate-400">
            Official Policy Reference Portal · Powered by Google Gemini AI & MongoDB · Educational compliance platform.
          </div>
        </div>
      </footer>
    </div>
  );
};
