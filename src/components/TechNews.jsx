import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useLanguage } from '../context/LanguageContext'; // Ajuste o caminho se precisar

export default function TechNews() {
  const { t } = useLanguage();
  const isPt = t.nav.home === "Início";
  const [news, setNews] = useState([]);

  useEffect(() => {
    // Busca os 10 artigos mais lidos da tag "programming" no DEV.to
    fetch('https://dev.to/api/articles?tag=programming&top=1&per_page=10')
      .then(res => res.json())
      .then(data => setNews(data))
      .catch(err => console.error("Erro ao buscar notícias:", err));
  }, []);

  if (news.length === 0) return null;

  return (
    <div className="w-full bg-black/40 border-y border-white/5 py-2 overflow-hidden flex items-center relative z-40 mt-8">
      {/* Estilo CSS embutido para a animação infinita */}
      <style>
        {`
          @keyframes ticker {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-ticker {
            display: flex;
            width: max-content;
            animation: ticker 40s linear infinite;
          }
          .animate-ticker:hover {
            animation-play-state: paused;
          }
        `}
      </style>

      {/* Sombras laterais para dar efeito de profundidade (Fade) */}
      <div className="absolute left-0 bg-gradient-to-r from-bg to-transparent w-8 md:w-16 h-full z-10 pointer-events-none"></div>
      <div className="absolute right-0 bg-gradient-to-l from-bg to-transparent w-8 md:w-16 h-full z-10 pointer-events-none"></div>
      
      {/* Badge Fixa na Esquerda */}
      <div className="flex items-center px-4 md:px-6 shrink-0 border-r border-white/10 z-20 bg-bg">
        <Icon icon="solar:global-bold" className="text-primary text-sm mr-2 animate-pulse" />
        <span className="text-primary font-mono text-[9px] md:text-[10px] uppercase tracking-widest font-bold">
          {isPt ? "RADAR TECH" : "TECH RADAR"}
        </span>
      </div>

      {/* Container do Letreiro Deslizante */}
      <div className="flex-1 overflow-hidden flex">
        <div className="animate-ticker items-center">
           {/* Duplicamos a lista para o efeito de loop infinito ser perfeito */}
           {[...news, ...news].map((item, index) => (
             <span key={`${item.id}-${index}`} className="flex items-center text-gray-400 text-xs font-mono mx-6">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-primary transition-colors cursor-pointer"
                >
                  {item.title}
                </a>
                <span className="text-white/20 ml-6">//</span>
             </span>
           ))}
        </div>
      </div>
    </div>
  );
}