import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  Download,
  Calendar,
  Layers,
  FileText,
  Bookmark,
  Share2,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { IPolicyDocument, IPolicyChunk } from '../types.ts';

interface PolicyDetailModalProps {
  policyId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onExplain: (policy: IPolicyDocument) => void;
  onAskChat: (policy: IPolicyDocument) => void;
}

export const PolicyDetailModal: React.FC<PolicyDetailModalProps> = ({
  policyId,
  isOpen,
  onClose,
  onExplain,
  onAskChat,
}) => {
  const [policy, setPolicy] = useState<IPolicyDocument | null>(null);
  const [chunks, setChunks] = useState<IPolicyChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    if (policyId && isOpen) {
      loadPolicy(policyId);
    } else {
      setPolicy(null);
      setChunks([]);
    }
  }, [policyId, isOpen]);

  const loadPolicy = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.getPolicyById(id);
      setPolicy(data.policy);
      setChunks(data.chunks);
      if (data.chunks.length > 0) {
        setSelectedSection(data.chunks[0].sectionTitle);
      }
    } catch (err) {
      console.error('Failed to load policy detail:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !policyId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl my-8 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400 mb-1">
              <span>{policy?.category}</span>
              <span>·</span>
              <span>v{policy?.version}</span>
              <span>·</span>
              <span className="text-slate-400">Effective {policy?.effectiveDate}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {policy?.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Author: {policy?.authorName} · {policy?.department}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {policy && (
              <>
                <button
                  onClick={() => onExplain(policy)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900 text-xs font-semibold hover:bg-teal-100 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Explain Policy</span>
                </button>
                <a
                  href={`/api/policies/${policy._id}/download`}
                  download
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                  title="Download Document"
                >
                  <Download className="h-4 w-4" />
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading || !policy ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading document text...</div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Left Section Navigation */}
            <div className="w-64 border-r border-slate-200 dark:border-slate-800 p-3 overflow-y-auto hidden md:block bg-slate-50/30 dark:bg-slate-950/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 px-2">
                Document Sections ({chunks.length})
              </span>
              <div className="space-y-1">
                {chunks.map((chunk) => (
                  <button
                    key={chunk._id}
                    onClick={() => setSelectedSection(chunk.sectionTitle)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      selectedSection === chunk.sectionTitle
                        ? 'bg-teal-50 dark:bg-teal-950/60 font-semibold text-teal-800 dark:text-teal-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate">{chunk.sectionTitle}</div>
                    {chunk.pageNumber && (
                      <span className="text-[10px] text-slate-400">Page {chunk.pageNumber}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Document Reader */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                {policy.content}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Document ID: <code className="font-mono text-[11px]">{policy?._id}</code>
          </span>
          <div className="flex items-center gap-2">
            {policy && (
              <button
                onClick={() => onAskChat(policy)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-colors shadow-2xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ask AI About This Document</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
