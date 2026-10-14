import React, { useState } from 'react';
import {
  ShieldCheck,
  Moon,
  Sun,
  Globe,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useThemeAndLang } from '../contexts/ThemeAndLangContext.tsx';
import { UserRole } from '../types.ts';

interface NavbarProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onNavigate,
  currentPage,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const { user, logout, switchDemoRole } = useAuth();
  const { theme, toggleTheme, language, setLanguage, t } = useThemeAndLang();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20' };
      case 'policy_manager':
        return { label: 'Policy Mgr', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      default:
        return { label: 'Student / Employee', color: 'bg-teal-500/10 text-teal-500 border-teal-500/20' };
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                Code of Conduct
              </span>
              <span className="ml-1.5 text-xs font-medium text-teal-600 dark:text-teal-400">
                Assistant
              </span>
            </div>
          </button>
        </div>

        {/* Center / Navigation Links (Desktop) */}
        <nav className="hidden items-center gap-1 md:flex">
          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
              currentPage === 'dashboard'
                ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {t.dashboard}
          </button>
          <button
            onClick={() => onNavigate('chat')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md flex items-center gap-1.5 ${
              currentPage === 'chat'
                ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-500" />
            {t.chatAssistant}
          </button>
          <button
            onClick={() => onNavigate('policies')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
              currentPage === 'policies'
                ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {t.policyLibrary}
          </button>
          <button
            onClick={() => onNavigate('scenarios')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
              currentPage === 'scenarios'
                ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {t.scenarioAnalyzer}
          </button>
          <button
            onClick={() => onNavigate('reporting')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
              currentPage === 'reporting'
                ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {t.reportingCenter}
          </button>
          {user && (user.role === 'admin' || user.role === 'policy_manager') && (
            <button
              onClick={() => onNavigate('admin')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-md ${
                currentPage === 'admin'
                  ? 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {t.adminGovernance}
            </button>
          )}
        </nav>

        {/* Right Controls: Role Switcher, Language, Theme, Auth */}
        <div className="flex items-center gap-2">
          {/* Quick Demo Role Switcher for instant evaluator testing */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Switch demo user role to test permissions"
            >
              <UserCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Role: {user ? getRoleBadge(user.role).label : 'Guest'}</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 shadow-lg z-50">
                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Switch Test Account
                </div>
                <button
                  onClick={() => {
                    switchDemoRole('student_employee');
                    setRoleDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <span>Student / Employee</span>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">Sarah</span>
                </button>
                <button
                  onClick={() => {
                    switchDemoRole('policy_manager');
                    setRoleDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <span>Policy Manager</span>
                  <span className="text-[10px] text-amber-500 font-mono">Marcus</span>
                </button>
                <button
                  onClick={() => {
                    switchDemoRole('admin');
                    setRoleDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <span>Administrator</span>
                  <span className="text-[10px] text-rose-500 font-mono">Dr. Vance</span>
                </button>
              </div>
            )}
          </div>

          {/* Language selector */}
          <div className="flex items-center rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-0.5 text-xs">
            <button
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                language === 'en'
                  ? 'bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                language === 'hi'
                  ? 'bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              title="हिंदी (Hindi)"
            >
              हिं
            </button>
            <button
              onClick={() => setLanguage('mr')}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                language === 'mr'
                  ? 'bg-white dark:bg-slate-800 font-semibold text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
              title="मराठी (Marathi)"
            >
              म
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User profile / login button */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white font-medium text-[11px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline font-medium">{user.name.split(' ')[0]}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${getRoleBadge(user.role).color}`}>
                        {getRoleBadge(user.role).label}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">{user.department}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate('dashboard');
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                  >
                    User Dashboard
                  </button>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('admin');
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                    >
                      Admin Console
                    </button>
                  )}

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800"></div>

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md flex items-center gap-1.5"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuth('login')}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
              >
                {t.login}
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="px-3 py-1.5 text-xs font-medium text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-md shadow-xs transition-colors"
              >
                {t.register}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => {
                onNavigate('dashboard');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t.dashboard}
            </button>
            <button
              onClick={() => {
                onNavigate('chat');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t.chatAssistant}
            </button>
            <button
              onClick={() => {
                onNavigate('policies');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t.policyLibrary}
            </button>
            <button
              onClick={() => {
                onNavigate('scenarios');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t.scenarioAnalyzer}
            </button>
            <button
              onClick={() => {
                onNavigate('reporting');
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t.reportingCenter}
            </button>
            {user && (user.role === 'admin' || user.role === 'policy_manager') && (
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="text-left px-3 py-2 text-sm font-medium rounded-md text-teal-600 dark:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.adminGovernance}
              </button>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-1">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Switch Demo Role:
              </p>
              <div className="grid grid-cols-3 gap-1 mt-1.5 px-3">
                <button
                  onClick={() => switchDemoRole('student_employee')}
                  className="py-1 px-1.5 text-[11px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Student
                </button>
                <button
                  onClick={() => switchDemoRole('policy_manager')}
                  className="py-1 px-1.5 text-[11px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Manager
                </button>
                <button
                  onClick={() => switchDemoRole('admin')}
                  className="py-1 px-1.5 text-[11px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Admin
                </button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
