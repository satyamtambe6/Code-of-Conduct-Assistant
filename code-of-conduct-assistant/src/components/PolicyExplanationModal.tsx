import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, AlertTriangle, XCircle, BookOpen, AlertCircle, Globe } from 'lucide-react';
import { api } from '../services/api.ts';
import { useThemeAndLang } from '../contexts/ThemeAndLangContext.tsx';
import { IPolicyDocument, IPolicyExplanation } from '../types.ts';

interface PolicyExplanationModalProps {
  policy: IPolicyDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PolicyExplanationModal: React.FC<PolicyExplanationModalProps> = ({
  policy,
  isOpen,
  onClose,
}) => {
  const { language } = useThemeAndLang();
  const [explanation, setExplanation] = useState<IPolicyExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (policy && isOpen) {
      loadExplanation();
    } else {
      setExplanation(null);
    }
  }, [policy, isOpen, language]);

  const loadExplanation = async () => {
    if (!policy) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.explainPolicy(policy._id, language);
      setExplanation(res.explanation);
    } catch (err) {
      setError('Failed to generate AI explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !policy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Plain-Language Policy Breakdown</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            {policy.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Category: {policy.category}</span>
            <span>·</span>
            <span>Version {policy.version}</span>
            <span>·</span>
            <span>{policy.department}</span>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 animate-pulse mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Generating simplified breakdown with Gemini AI...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Distilling key rules, behavioral examples, and actionable dos & don'ts.
            </p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        ) : explanation ? (
          <div className="space-y-6 text-xs sm:text-sm">
            {/* Plain language summary */}
            <div className="rounded-xl border border-teal-200/80 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 p-4">
              <h3 className="font-bold text-teal-950 dark:text-teal-200 mb-1 text-xs uppercase tracking-wider">
                Plain-Language Overview
              </h3>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                {explanation.summary}
              </p>
            </div>

            {/* Core Rules */}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>Important Rules You Must Follow</span>
              </h3>
              <ul className="space-y-1.5">
                {explanation.importantRules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <span className="text-teal-600 font-bold shrink-0 mt-0.5">•</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What to Do vs What to Avoid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Do */}
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/30 dark:bg-emerald-950/20 p-4">
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-1.5 text-xs uppercase">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>What You Should Do</span>
                </h4>
                <ul className="space-y-1.5">
                  {explanation.whatToDo.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 text-xs">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Avoid */}
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-rose-950/20 p-4">
                <h4 className="font-bold text-rose-800 dark:text-rose-300 mb-2 flex items-center gap-1.5 text-xs uppercase">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  <span>What You Must Avoid</span>
                </h4>
                <ul className="space-y-1.5">
                  {explanation.whatToAvoid.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 text-xs">
                      <span className="text-rose-600 font-bold">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Realistic Examples */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-xs uppercase tracking-wider text-teal-600 dark:text-teal-400">
                  Example: Acceptable Conduct
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {explanation.acceptableExamples.map((ex, idx) => (
                    <li key={idx} className="italic">
                      "{ex}"
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Example: Unacceptable Misconduct
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  {explanation.unacceptableExamples.map((ex, idx) => (
                    <li key={idx} className="italic">
                      "{ex}"
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Official Disclaimer */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/30 p-3.5 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Legal & Compliance Disclaimer:</strong> {explanation.disclaimer}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
