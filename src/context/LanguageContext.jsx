import { useCallback, useEffect, useMemo, useState } from 'react';
import { content } from '../data/content';
import { LanguageContext } from './languageContext';

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    try {
      const savedLang = localStorage.getItem('portfolioLanguage');
      if (savedLang === 'pt' || savedLang === 'en') return savedLang;
    } catch {
      // Storage can be unavailable in private/restricted browsing contexts.
    }

    const userLang = navigator.language || navigator.userLanguage || 'pt-BR';
    return userLang.toLowerCase().startsWith('pt') ? 'pt' : 'en';
  });

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';

    try {
      localStorage.setItem('portfolioLanguage', lang);
    } catch {
      // The language still works for the current session without persistence.
    }
  }, [lang]);

  const toggleLanguage = useCallback(() => {
    setLang((prev) => (prev === 'pt' ? 'en' : 'pt'));
  }, []);

  const value = useMemo(
    () => ({ lang, toggleLanguage, t: content[lang] }),
    [lang, toggleLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
