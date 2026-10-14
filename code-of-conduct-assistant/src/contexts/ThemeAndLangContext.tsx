import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppLanguage, translations } from '../i18n/translations.ts';

interface ThemeAndLangContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: typeof translations['en'];
}

const ThemeAndLangContext = createContext<ThemeAndLangContextType | undefined>(undefined);

export const ThemeAndLangProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('conduct_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('conduct_lang');
    return saved === 'hi' || saved === 'mr' ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('conduct_theme', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('conduct_lang', lang);
  };

  const t = translations[language] || translations['en'];

  return (
    <ThemeAndLangContext.Provider
      value={{
        theme,
        toggleTheme,
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </ThemeAndLangContext.Provider>
  );
};

export function useThemeAndLang() {
  const context = useContext(ThemeAndLangContext);
  if (!context) {
    throw new Error('useThemeAndLang must be used within ThemeAndLangProvider');
  }
  return context;
}
