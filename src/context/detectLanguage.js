// Saved preference first, then the browser language; Portuguese when nothing is known (also on the server).
export function detectLanguage() {
  if (typeof window === 'undefined') return 'pt';

  try {
    const savedLang = localStorage.getItem('portfolioLanguage');
    if (savedLang === 'pt' || savedLang === 'en') return savedLang;
  } catch {
    // Storage can be unavailable in private/restricted browsing contexts.
  }

  const userLang = navigator.language || navigator.userLanguage || 'pt-BR';
  return userLang.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}
