import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ThemeAndLangProvider } from './contexts/ThemeAndLangContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ChatPage } from './pages/ChatPage.tsx';
import { PolicyLibraryPage } from './pages/PolicyLibraryPage.tsx';
import { ScenarioAnalyzerPage } from './pages/ScenarioAnalyzerPage.tsx';
import { ReportingGuidancePage } from './pages/ReportingGuidancePage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Chat navigation params
  const [chatPrompt, setChatPrompt] = useState<string | undefined>(undefined);
  const [initialPolicyId, setInitialPolicyId] = useState<string | undefined>(undefined);

  const handleNavigate = (page: string, params?: { prompt?: string; policyId?: string }) => {
    if (params?.prompt) {
      setChatPrompt(params.prompt);
    } else {
      setChatPrompt(undefined);
    }

    if (params?.policyId) {
      setInitialPolicyId(params.policyId);
    } else {
      setInitialPolicyId(undefined);
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Navbar
        onOpenAuth={handleOpenAuth}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main className="flex-1">
        {currentPage === 'landing' && (
          <LandingPage onNavigate={handleNavigate} onOpenAuth={handleOpenAuth} />
        )}
        {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
        {currentPage === 'chat' && (
          <ChatPage
            initialPrompt={chatPrompt}
            onNavigatePolicy={(policyId) => handleNavigate('policies', { policyId })}
          />
        )}
        {currentPage === 'policies' && (
          <PolicyLibraryPage
            initialPolicyId={initialPolicyId}
            onNavigateChat={(prompt) => handleNavigate('chat', { prompt })}
          />
        )}
        {currentPage === 'scenarios' && (
          <ScenarioAnalyzerPage onNavigateReporting={() => handleNavigate('reporting')} />
        )}
        {currentPage === 'reporting' && <ReportingGuidancePage />}
        {currentPage === 'admin' && <AdminDashboardPage />}
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeAndLangProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeAndLangProvider>
  );
}
