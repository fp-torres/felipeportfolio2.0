import { createContext, useState, useContext } from 'react';
import { content } from '../data/content';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('pt'); // Padrão PT

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'pt' ? 'en' : 'pt'));
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t: content[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);