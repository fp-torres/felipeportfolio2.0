import { useCallback, useEffect, useMemo, useState } from 'react';
import { content } from '../data/content';
import { LanguageContext } from './LanguageContext';
import { detectLanguage } from './detectLanguage';

// initialLang comes from the entry point: 'pt' when pre-rendering, the visitor's preference in the browser.
export const LanguageProvider = ({ children, initialLang }) => {
  const [lang, setLang] = useState(() => initialLang ?? detectLanguage());

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

  const setLanguage = useCallback((next) => {
    if (next === 'pt' || next === 'en') setLang(next);
  }, []);

  const value = useMemo(
    () => ({ lang, toggleLanguage, setLanguage, t: content[lang] }),
    [lang, toggleLanguage, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
