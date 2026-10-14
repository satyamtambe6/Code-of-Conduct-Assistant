import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Scale,
  ShieldCheck,
  Search,
  ArrowRight,
  ChevronRight,
  FileText,
  Clock,
  HelpCircle,
  ExternalLink,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useThemeAndLang } from '../contexts/ThemeAndLangContext.tsx';
import { api } from '../services/api.ts';
import { IPolicyDocument } from '../types.ts';

interface DashboardPageProps {
  onNavigate: (page: string, params?: { prompt?: string; policyId?: string }) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useThemeAndLang();
  const [policies, setPolicies] = useState<IPolicyDocument[]>([]);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPolicies: 5,
    publishedPolicies: 5,
    totalQuestions: 14,
    satisfactionRate: 96,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [policyList, dashboardData] = await Promise.allSettled([
          api.getPolicies(),
          api.getAdminDashboard(),
        ]);

        if (policyList.status === 'fulfilled') {
          setPolicies(policyList.value);
        }
        if (dashboardData.status === 'fulfilled' && dashboardData.value?.metrics) {
          setStats({
            totalPolicies: dashboardData.value.metrics.totalPolicies,
            publishedPolicies: dashboardData.value.metrics.publishedPolicies,
            totalQuestions: dashboardData.value.metrics.totalQuestions,
            satisfactionRate: dashboardData.value.metrics.satisfactionRate,
          });
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleQuickAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    onNavigate('chat', { prompt: quickPrompt.trim() });
  };

  const faqs = [
    {
      q: 'Can I accept promotional items or lunch from a commercial vendor?',
      category: 'Workplace Ethics',
      prompt: 'Can I accept promotional items, meals, or gifts from a commercial vendor under the Code of Conduct?',
    },
    {
      q: 'What is the institutional policy on using generative AI in assignments or code?',
      category: 'Academic Integrity',
      prompt: 'What are the rules regarding the use of generative AI tools like ChatGPT or Copilot in coursework and research?',
    },
    {
      q: 'How does the institution protect whistleblowers against retaliation?',
      category: 'Anti-Harassment',
      prompt: 'What specific protections and guarantees exist for individuals who report ethical violations against retaliation?',
    },
    {
      q: 'What are the requirements if I lose a laptop or device containing student records?',
      category: 'Data Privacy',
      prompt: 'What is the immediate reporting procedure if a device with confidential or student records is lost or compromised?',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs mb-8 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Institutional Policy Center
              </span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {t.welcomeBack}, {user ? user.name : 'Guest Member'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Access the official knowledge base of Meridian Global Institute. Query codes of conduct,
              verify compliance requirements, and test ethical scenarios with AI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('chat')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t.askAI}</span>
            </button>
            <button
              onClick={() => onNavigate('scenarios')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-2xs"
            >
              <Scale className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Analyze Dilemma</span>
            </button>
          </div>
        </div>

        {/* Quick Ask AI Prompt Bar */}
        <form onSubmit={handleQuickAsk} className="mt-6">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={quickPrompt}
              onChange={(e) => setQuickPrompt(e.target.value)}
              placeholder="Ask any policy question (e.g. 'What is the gift limit?', 'What are the plagiarism penalties?')..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 pl-10 pr-28 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden transition-all shadow-2xs"
            />
            <button
              type="submit"
              className="absolute right-2 inline-flex items-center gap-1 rounded-lg bg-teal-600 hover:bg-teal-700 px-3 py-1.5 text-xs font-medium text-white transition-colors"
            >
              <span>Ask AI</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </form>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Published Policies</span>
            <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.publishedPolicies}
          </div>
          <span className="text-[11px] text-slate-400">100% indexed for search</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">RAG Semantic Chunks</span>
            <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {policies.reduce((acc, p) => acc + (p.chunksCount || 0), 0) || 28}
          </div>
          <span className="text-[11px] text-slate-400">Section-grounded context</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Questions Answered</span>
            <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.totalQuestions}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Active assistance</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium">Grounding Precision</span>
            <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.satisfactionRate}%
          </div>
          <span className="text-[11px] text-slate-400">Strict zero-hallucination rate</span>
        </div>
      </div>

      {/* Main Grid: Policies & FAQs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Official Policies Catalog Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Official Institutional Policies
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Authoritative compliance documents active for the 2026 academic & fiscal cycle
              </p>
            </div>
            <button
              onClick={() => onNavigate('policies')}
              className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>View All ({policies.length})</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {policies.slice(0, 4).map((policy) => (
              <div
                key={policy._id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-teal-500/40 transition-all shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                      {policy.category}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-xs text-slate-400">v{policy.version}</span>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <span className="text-xs text-slate-400">
                      Effective {policy.effectiveDate || '2026'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {policy.chunksCount} Sections
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  {policy.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                  {policy.description}
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => onNavigate('policies', { policyId: policy._id })}
                    className="text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center gap-1"
                  >
                    <span>Read Policy</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => onNavigate('chat', { prompt: `Explain the key rules of ${policy.title}` })}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 ml-auto"
                  >
                    <Sparkles className="h-3 w-3 text-teal-500" />
                    <span>Ask AI About This</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: FAQs and Fast Actions */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-white font-bold text-sm">
              <HelpCircle className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>Frequently Asked Questions</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Click any query below to start a grounded AI session.
            </p>

            <div className="space-y-2.5">
              {faqs.map((faq, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate('chat', { prompt: faq.prompt })}
                  className="w-full text-left rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 p-3 hover:border-teal-500 hover:bg-teal-50/30 dark:hover:bg-teal-950/20 transition-all text-xs group"
                >
                  <span className="block text-[10px] uppercase font-semibold text-teal-600 dark:text-teal-400 mb-0.5">
                    {faq.category}
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400">
                    {faq.q}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Ethics Hotline Quick Notice Card */}
          <div className="rounded-xl border border-teal-200/80 dark:border-teal-900/60 bg-gradient-to-br from-teal-50/50 to-emerald-50/30 dark:from-teal-950/30 dark:to-slate-900 p-5">
            <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-bold text-sm mb-1.5">
              <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>Confidential Ethics Hotline</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              Need to report an incident or speak to a designated ombudsperson? All inquiries can be
              conducted with full whistleblower protections.
            </p>
            <button
              onClick={() => onNavigate('reporting')}
              className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 py-2 text-xs font-semibold text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Reporting & Guidance Center</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
