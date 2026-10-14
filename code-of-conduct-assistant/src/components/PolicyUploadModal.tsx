import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api.ts';
import { PolicyCategory, PolicyStatus, IPolicyDocument } from '../types.ts';

interface PolicyUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (policy: IPolicyDocument) => void;
}

const CATEGORIES: PolicyCategory[] = [
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

export const PolicyUploadModal: React.FC<PolicyUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PolicyCategory>('Workplace Ethics');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('Compliance & Governance');
  const [version, setVersion] = useState('2026.1');
  const [status, setStatus] = useState<PolicyStatus>('published');
  const [tags, setTags] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Document title is required.');
      return;
    }

    if (uploadMode === 'file' && !file) {
      setError('Please choose a PDF or TXT file to upload.');
      return;
    }

    if (uploadMode === 'text' && !manualContent.trim()) {
      setError('Please enter policy document text.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('department', department.trim());
      formData.append('version', version.trim());
      formData.append('status', status);
      formData.append('tags', tags);

      if (uploadMode === 'file' && file) {
        formData.append('file', file);
      } else {
        formData.append('manualContent', manualContent.trim());
      }

      const res = await api.createPolicy(formData);
      onSuccess(res.policy);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to upload and index document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 mb-2">
            <UploadCloud className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Upload & Index Policy Document
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Uploaded policies are parsed into semantic chunks and made available for AI RAG queries
            and user search.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Policy Document Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Student Code of Academic Integrity"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PolicyCategory)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Brief Summary / Scope
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Standards for ethical conduct, examinations, and citation protocols."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Department, Version, Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Academic Affairs"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Version
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="2026.1"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PolicyStatus)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
              >
                <option value="published">Published (Live for AI)</option>
                <option value="draft">Draft (Restricted)</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Search Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ethics, exams, plagiarism, academic integrity"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
            />
          </div>

          {/* Upload Method Tabs */}
          <div className="pt-2">
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-3">
              <button
                type="button"
                onClick={() => setUploadMode('file')}
                className={`pb-2 px-3 font-semibold border-b-2 transition-colors ${
                  uploadMode === 'file'
                    ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Upload File (PDF / TXT)
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('text')}
                className={`pb-2 px-3 font-semibold border-b-2 transition-colors ${
                  uploadMode === 'text'
                    ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Paste Direct Text
              </button>
            </div>

            {uploadMode === 'file' ? (
              <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 text-center hover:border-teal-500 transition-colors">
                <input
                  type="file"
                  id="policy-file-input"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                      if (!title) {
                        const nameWithoutExt = e.target.files[0].name.replace(/\.[^/.]+$/, '');
                        setTitle(nameWithoutExt.replace(/[-_]/g, ' '));
                      }
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="policy-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  <FileText className="h-8 w-8 text-teal-600 dark:text-teal-400 mb-2" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {file ? file.name : 'Click to select PDF or TXT document'}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-1">
                    {file
                      ? `${(file.size / 1024).toFixed(1)} KB selected`
                      : 'Supports PDF and plain text up to 10MB'}
                  </span>
                </label>
              </div>
            ) : (
              <textarea
                rows={6}
                value={manualContent}
                onChange={(e) => setManualContent(e.target.value)}
                placeholder="Paste the complete policy document text here, including SECTION 1, SECTION 2, etc..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 p-3 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden font-mono text-xs"
              />
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold shadow-xs"
            >
              {loading ? 'Extracting & Indexing...' : 'Upload & Publish Policy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
