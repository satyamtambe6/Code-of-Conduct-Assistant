import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { UserRole } from '../types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register, switchDemoRole } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('student_employee');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          name,
          email,
          password,
          role,
          department,
        });
      }
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (demoRole: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      await switchDemoRole(demoRole);
      onClose();
    } catch (err) {
      setError((err as Error).message || 'Failed to switch demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {mode === 'login' ? 'Sign in to Code of Conduct' : 'Create Your Account'}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {mode === 'login'
              ? 'Access institutional policies and personalized compliance tools'
              : 'Register to ask questions, bookmark policies, and analyze scenarios'}
          </p>
        </div>

        {/* 1-Click Quick Demo Accounts Selector */}
        <div className="mb-5 rounded-xl border border-teal-100 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-950/30 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800 dark:text-teal-300">
              ⚡ Instant 1-Click Test Accounts
            </span>
            <span className="text-[10px] text-teal-600 dark:text-teal-400">Pre-seeded</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoSelect('student_employee')}
              className="px-2 py-1.5 text-left rounded-lg bg-white dark:bg-slate-800 border border-teal-200/80 dark:border-teal-800/80 hover:border-teal-500 text-xs transition-all shadow-2xs group"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 text-[11px]">
                Student / Emp
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Sarah Chen</div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoSelect('policy_manager')}
              className="px-2 py-1.5 text-left rounded-lg bg-white dark:bg-slate-800 border border-teal-200/80 dark:border-teal-800/80 hover:border-teal-500 text-xs transition-all shadow-2xs group"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 text-[11px]">
                Policy Mgr
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">M. Sterling</div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoSelect('admin')}
              className="px-2 py-1.5 text-left rounded-lg bg-white dark:bg-slate-800 border border-teal-200/80 dark:border-teal-800/80 hover:border-teal-500 text-xs transition-all shadow-2xs group"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 text-[11px]">
                Admin
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Dr. Vance</div>
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 pb-2 text-xs font-medium text-center border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Sign In with Email
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 pb-2 text-xs font-medium text-center border-b-2 transition-colors ${
              mode === 'register'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            New Registration
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-2.5 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 focus:outline-hidden"
                  >
                    <option value="student_employee">Student / Employee</option>
                    <option value="policy_manager">Policy Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.edu"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
            {mode === 'login' && (
              <p className="mt-1 text-[11px] text-slate-400">
                Demo password: <code className="font-mono text-teal-600 dark:text-teal-400">admin123</code> / <code className="font-mono text-teal-600 dark:text-teal-400">manager123</code> / <code className="font-mono text-teal-600 dark:text-teal-400">user123</code>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-lg bg-teal-600 hover:bg-teal-700 py-2.5 text-xs font-semibold text-white shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400">
            Protected by enterprise encryption & RBAC. Policies stored securely in MongoDB.
          </p>
        </div>
      </div>
    </div>
  );
};
