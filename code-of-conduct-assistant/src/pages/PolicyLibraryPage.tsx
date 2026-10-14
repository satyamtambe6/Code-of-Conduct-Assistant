import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Sparkles,
  Download,
  Plus,
  Bookmark,
  Calendar,
  Layers,
  FileText,
  CheckCircle,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useThemeAndLang } from '../contexts/ThemeAndLangContext.tsx';
import { api } from '../services/api.ts';
import { IPolicyDocument, PolicyCategory } from '../types.ts';
import { PolicyDetailModal } from '../components/PolicyDetailModal.tsx';
import { PolicyExplanationModal } from '../components/PolicyExplanationModal.tsx';
import { PolicyUploadModal } from '../components/PolicyUploadModal.tsx';

interface PolicyLibraryPageProps {
  onNavigateChat: (prompt: string) => void;
  initialPolicyId?: string;
}

const CATEGORIES: string[] = [
  'All',
  'Workplace Ethics',
  'Student Conduct',
  'Anti-Harassment',
  'Anti-Discrimination',
  'Academic Integrity',
  'Data Privacy',
  'Cybersecurity',
  'Conflict of Interest',
  'Social Media Policy',
  'Health and Safety',
  'Professional Behavior',
];

export const PolicyLibraryPage: React.FC<PolicyLibraryPageProps> = ({
  onNavigateChat,
  initialPolicyId,
}) => {
  const { user } = useAuth();
  const { t } = useThemeAndLang();

  const [policies, setPolicies] = useState<IPolicyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDocType, setSelectedDocType] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'alphabetical'>('newest');

  // Modals state
  const [activeDetailId, setActiveDetailId] = useState<string | null>(initialPolicyId || null);
  const [explainingPolicy, setExplainingPolicy] = useState<IPolicyDocument | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('conduct_bookmarks') || '[]');
    } catch {
      return [];
    }
  });

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = bookmarkedIds.includes(id)
      ? bookmarkedIds.filter((b) => b !== id)
      : [...bookmarkedIds, id];
    setBookmarkedIds(updated);
    localStorage.setItem('conduct_bookmarks', JSON.stringify(updated));
  };

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const data = await api.getPolicies({
        category: selectedCategory,
        search: searchQuery,
        sort: sortBy,
      });
      setPolicies(data);
    } catch (err) {
      console.error('Failed to load policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, [selectedCategory, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPolicies();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredPolicies = policies.filter((p) => {
    if (selectedDocType !== 'All' && p.documentType !== selectedDocType) {
      return false;
    }
    return true;
  });

  const canManagePolicies = user && (user.role === 'admin' || user.role === 'policy_manager');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Institutional Repository
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-400">
              {filteredPolicies.length} Active Policies Indexed
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Policy & Governance Library
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Search, review, and download official conduct standards. Use the AI explainer for
            plain-language interpretations.
          </p>
        </div>

        {canManagePolicies && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Upload New Policy</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by policy title, keywords, sections, or tags..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Doc Type Filter */}
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
          >
            <option value="All">All Formats</option>
            <option value="PDF">PDF Documents</option>
            <option value="TXT">Text Documents</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'alphabetical')}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
          >
            <option value="newest">Sort: Newest / Effective Date</option>
            <option value="alphabetical">Sort: Alphabetical (A-Z)</option>
          </select>
        </div>

        {/* Categories Scroller (Interactive Filter Controls) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                selectedCategory === cat
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Policy Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading policy documents...</div>
      ) : filteredPolicies.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            No policies found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try adjusting your search criteria or selecting another category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolicies.map((policy) => {
            const isBookmarked = bookmarkedIds.includes(policy._id);

            return (
              <div
                key={policy._id}
                onClick={() => setActiveDetailId(policy._id)}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-teal-500 dark:hover:border-teal-500 transition-all shadow-2xs cursor-pointer"
              >
                <div>
                  {/* Category and Bookmark */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-teal-600 dark:text-teal-400">
                        {policy.category}
                      </span>
                      <span>·</span>
                      <span>v{policy.version}</span>
                    </div>

                    <button
                      onClick={(e) => toggleBookmark(policy._id, e)}
                      className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                        isBookmarked ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title={isBookmarked ? 'Remove bookmark' : 'Bookmark policy'}
                    >
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-2">
                    {policy.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                    {policy.description}
                  </p>

                  {/* Metadata line */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>Effective: {policy.effectiveDate || '2026-01-01'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="h-3 w-3" />
                      <span>
                        {policy.chunksCount} RAG sections · {policy.department}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExplainingPolicy(policy);
                    }}
                    className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 font-semibold"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Explain Policy</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateChat(`What are the key compliance rules in ${policy.title}?`);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Ask AI about this"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                    </button>
                    <a
                      href={`/api/policies/${policy._id}/download`}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Download Document"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reader Modal */}
      <PolicyDetailModal
        policyId={activeDetailId}
        isOpen={Boolean(activeDetailId)}
        onClose={() => setActiveDetailId(null)}
        onExplain={(pol) => setExplainingPolicy(pol)}
        onAskChat={(pol) => {
          setActiveDetailId(null);
          onNavigateChat(`Explain the requirements and procedures in ${pol.title}`);
        }}
      />

      {/* AI Policy Explanation Breakdown Modal */}
      <PolicyExplanationModal
        policy={explainingPolicy}
        isOpen={Boolean(explainingPolicy)}
        onClose={() => setExplainingPolicy(null)}
      />

      {/* Upload Modal (Admin / Policy Manager) */}
      <PolicyUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={(newPol) => {
          setPolicies((prev) => [newPol, ...prev]);
        }}
      />
    </div>
  );
};
