import { createContext, useState, useEffect, useContext } from 'react';
import { content } from '../data/content';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Inicialização inteligente: Verifica o localStorage PRIMEIRO, 
  // depois verifica o navegador, e o fallback final é 'pt' (Português Brasileiro).
  const [lang, setLang] = useState(() => {
    const savedLang = localStorage.getItem('portfolioLanguage');
    if (savedLang) return savedLang;

    // Se não tem salvo, verifica o idioma do sistema do usuário
    const userLang = navigator.language || navigator.userLanguage;
    if (userLang.toLowerCase().includes('pt')) {
      return 'pt';
    }
    
    // Fallback de segurança para o mercado internacional
    return 'en'; 
  });

  // Sempre que o idioma mudar, salva no localStorage
  useEffect(() => {
    localStorage.setItem('portfolioLanguage', lang);
  }, [lang]);

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