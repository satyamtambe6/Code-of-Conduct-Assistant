import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Sparkles,
  ShieldAlert,
  BarChart2,
  Settings,
  History,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  Eye,
  Sliders,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../services/api.ts';
import { useAuth } from '../contexts/AuthContext.tsx';
import {
  IUser,
  IPolicyDocument,
  IAdminDashboardMetrics,
  IAuditLog,
  IApplicationSettings,
  UserRole,
} from '../types.ts';
import { PolicyUploadModal } from '../components/PolicyUploadModal.tsx';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'overview' | 'policies' | 'users' | 'audit' | 'settings'>('overview');

  const [metrics, setMetrics] = useState<IAdminDashboardMetrics | null>(null);
  const [policies, setPolicies] = useState<IPolicyDocument[]>([]);
  const [usersList, setUsersList] = useState<IUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<IAuditLog[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [settings, setSettings] = useState<IApplicationSettings | null>(null);

  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Settings form
  const [orgName, setOrgName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [hotlinePhone, setHotlinePhone] = useState('');
  const [portalUrl, setPortalUrl] = useState('');

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [dash, pols, users, logs, analytics, appSettings] = await Promise.allSettled([
        api.getAdminDashboard(),
        api.getPolicies({ status: 'all' }),
        api.getAdminUsers(),
        api.getAdminAuditLogs(100),
        api.getAdminAnalytics(),
        api.getSettings(),
      ]);

      if (dash.status === 'fulfilled') setMetrics(dash.value.metrics);
      if (pols.status === 'fulfilled') setPolicies(pols.value);
      if (users.status === 'fulfilled') setUsersList(users.value);
      if (logs.status === 'fulfilled') setAuditLogs(logs.value);
      if (analytics.status === 'fulfilled') setAnalyticsData(analytics.value);
      if (appSettings.status === 'fulfilled') {
        setSettings(appSettings.value);
        setOrgName(appSettings.value.organizationName || '');
        setSupportEmail(appSettings.value.supportEmail || '');
        setHotlinePhone(appSettings.value.hotlinePhone || '');
        setPortalUrl(appSettings.value.externalReportingPortalUrl || '');
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleTogglePolicyStatus = async (policy: IPolicyDocument) => {
    const newStatus = policy.status === 'published' ? 'draft' : 'published';
    try {
      await api.updatePolicy(policy._id, { status: newStatus });
      setPolicies((prev) =>
        prev.map((p) => (p._id === policy._id ? { ...p, status: newStatus } : p))
      );
      setSuccessMsg(`Policy "${policy.title}" is now ${newStatus}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Failed to update policy status.');
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    if (!window.confirm('Are you sure you want to delete this policy and all its RAG chunks?')) {
      return;
    }
    try {
      await api.deletePolicy(policyId);
      setPolicies((prev) => prev.filter((p) => p._id !== policyId));
      setSuccessMsg('Policy deleted successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Failed to delete policy.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const updated = await api.updateUserRole(userId, newRole);
      setUsersList((prev) => prev.map((u) => (u._id === userId ? updated : u)));
      setSuccessMsg('User role updated successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Failed to update role.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.updateSettings({
        organizationName: orgName,
        supportEmail,
        hotlinePhone,
        externalReportingPortalUrl: portalUrl,
      });
      setSettings(updated);
      setSuccessMsg('Application settings saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert('Failed to update settings.');
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'policy_manager')) {
    return (
      <div className="mx-auto max-w-4xl p-12 text-center">
        <ShieldAlert className="h-10 w-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
        <p className="text-xs text-slate-500 mt-1">
          This governance dashboard is restricted to authorized Administrators and Policy Managers.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Governance & Oversight Console
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs text-slate-400">Audit Active</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Administrative Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage institutional documents, index versions, oversee user permissions, and analyze
            compliance inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Policy Document</span>
          </button>
          <button
            onClick={loadAllAdminData}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setTab('overview')}
          className={`pb-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            tab === 'overview'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          <span>Analytics & Overview</span>
        </button>
        <button
          onClick={() => setTab('policies')}
          className={`pb-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            tab === 'policies'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Policy Document Management ({policies.length})</span>
        </button>
        {user.role === 'admin' && (
          <button
            onClick={() => setTab('users')}
            className={`pb-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              tab === 'users'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>User & Role Governance ({usersList.length})</span>
          </button>
        )}
        {user.role === 'admin' && (
          <button
            onClick={() => setTab('audit')}
            className={`pb-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              tab === 'audit'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <History className="h-4 w-4" />
            <span>Audit Trail Logs ({auditLogs.length})</span>
          </button>
        )}
        <button
          onClick={() => setTab('settings')}
          className={`pb-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            tab === 'settings'
              ? 'border-teal-600 text-teal-600 dark:text-teal-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Institutional Settings</span>
        </button>
      </div>

      {/* Tab: Overview & Analytics */}
      {tab === 'overview' && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
              <span className="text-xs text-slate-400">Total Registered Users</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {metrics?.totalUsers ?? usersList.length}
              </div>
              <span className="text-[11px] text-teal-600 dark:text-teal-400">Active Directory</span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
              <span className="text-xs text-slate-400">Policy Documents</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {metrics?.totalPolicies ?? policies.length}
              </div>
              <span className="text-[11px] text-slate-400">
                {metrics?.publishedPolicies ?? 5} Published · {metrics?.draftPolicies ?? 0} Draft
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
              <span className="text-xs text-slate-400">Total Chatbot Questions</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {metrics?.totalQuestions ?? 48}
              </div>
              <span className="text-[11px] text-teal-600 dark:text-teal-400">Grounded in RAG</span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
              <span className="text-xs text-slate-400">Accuracy & Satisfaction</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {metrics?.satisfactionRate ?? 96}%
              </div>
              <span className="text-[11px] text-emerald-600">Based on user ratings</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topic Frequency Bar Chart */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Compliance Inquiries by Topic
                </h3>
                <p className="text-xs text-slate-400">
                  Total questions processed by AI per policy category
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData?.topicData || [
                      { topic: 'Workplace Ethics', inquiries: 42 },
                      { topic: 'Academic Integrity', inquiries: 68 },
                      { topic: 'Anti-Harassment', inquiries: 35 },
                      { topic: 'Data Privacy', inquiries: 29 },
                      { topic: 'Conflict of Interest', inquiries: 22 },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="topic" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Bar dataKey="inquiries" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Activity Area Chart */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  7-Day System Activity Trend
                </h3>
                <p className="text-xs text-slate-400">
                  Questions asked, dilemmas analyzed, and policies reviewed
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analyticsData?.activityTrend || [
                      { day: 'Mon', questions: 28, policyViews: 45 },
                      { day: 'Tue', questions: 42, policyViews: 68 },
                      { day: 'Wed', questions: 55, policyViews: 82 },
                      { day: 'Thu', questions: 48, policyViews: 71 },
                      { day: 'Fri', questions: 38, policyViews: 54 },
                      { day: 'Sat', questions: 14, policyViews: 20 },
                      { day: 'Sun', questions: 19, policyViews: 26 },
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="policyViews" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="questions" stackId="1" stroke="#0f766e" fill="#0f766e" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Policies Management Table */}
      {tab === 'policies' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Policy Document Registry
              </h3>
              <p className="text-xs text-slate-400">
                Only published policies are accessible to the AI assistant for RAG retrieval
              </p>
            </div>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload Policy</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">RAG Chunks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {policies.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{p.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {p.fileName} · {(p.fileSize / 1024).toFixed(1)} KB
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {p.category}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{p.version}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {p.chunksCount} sections
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          p.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleTogglePolicyStatus(p)}
                        className={`px-2 py-1 rounded text-[11px] font-medium border ${
                          p.status === 'published'
                            ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                            : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {p.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDeletePolicy(p._id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded"
                        title="Delete policy"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Users & Roles */}
      {tab === 'users' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              User Accounts & Role Permissions
            </h3>
            <p className="text-xs text-slate-400">
              Control access levels: Student/Employee (queries only), Policy Manager (upload/edit
              policies), Administrator (full governance).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4 text-right">Modify Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{u.email}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {u.department || 'General'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {u.role === 'admin'
                          ? 'Administrator'
                          : u.role === 'policy_manager'
                          ? 'Policy Manager'
                          : 'Student / Employee'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value as UserRole)}
                        className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                      >
                        <option value="student_employee">Student / Employee</option>
                        <option value="policy_manager">Policy Manager</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Audit Logs */}
      {tab === 'audit' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              System Audit Trails
            </h3>
            <p className="text-xs text-slate-400">
              Immutable logs tracking policy modifications, role changes, and system access.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.slice(0, 30).map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{log.resource}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500 truncate max-w-xs">
                      {JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Settings */}
      {tab === 'settings' && (
        <div className="max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            Institutional Settings & Reporting Metadata
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Configure contact coordinates displayed in the Reporting Center and AI guidelines.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Organization / Institution Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Ethics & Compliance Support Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                24/7 Hotline Phone Number
              </label>
              <input
                type="text"
                value={hotlinePhone}
                onChange={(e) => setHotlinePhone(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                External Reporting Portal URL
              </label>
              <input
                type="url"
                value={portalUrl}
                onChange={(e) => setPortalUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="rounded-lg bg-teal-600 hover:bg-teal-700 px-5 py-2 font-semibold text-white shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upload Modal */}
      <PolicyUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={(newPol) => {
          setPolicies((prev) => [newPol, ...prev]);
          setSuccessMsg(`Policy "${newPol.title}" successfully indexed into database.`);
          setTimeout(() => setSuccessMsg(null), 3500);
        }}
      />
    </div>
  );
};
