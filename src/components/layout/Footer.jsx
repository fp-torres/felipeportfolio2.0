import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';

import NasaModal from '../NasaModal'; 
import NasaTimeMachine from '../NasaTimeMachine'; 
import TechNews from '../TechNews'; 
import CvModal from '../CvModal';

export default function Footer() {
  const { t } = useLanguage();
  const isPt = t.nav.home === "Início";
  
  const [isNasaOpen, setIsNasaOpen] = useState(false);
  const [isTimeMachineOpen, setIsTimeMachineOpen] = useState(false);
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);

  return (
    <footer id="contact" className="bg-surface relative pt-20 mt-20 border-t border-white/5 flex flex-col items-center">
      <div className="max-w-4xl w-full mx-auto px-6 text-center pb-10">
        
        {/* ── Contact CTA ── */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">{t.footer.title}</h2>
          <p className="text-muted mb-8">{t.footer.subtitle}</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:felipetorresaraujo@gmail.com"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-bg font-bold rounded-full hover:bg-primary-600 transition-all hover:scale-105 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
            >
              <Icon icon="solar:letter-bold" width="20" />
              {t.footer.emailBtn}
            </a>
            
            <button 
              onClick={() => setIsCvModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all hover:scale-105"
            >
              <Icon icon="solar:file-download-bold" width="20" />
              {t.hero.ctaResume}
            </button>
          </div>
        </div>

        {/* ── Social Links ── */}
        <div className="flex justify-center gap-6 md:gap-8 mb-16">
          <a href="https://linkedin.com/in/felipe-torres-id" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary transition-colors hover:-translate-y-1 transform duration-300">
            <Icon icon="mdi:linkedin" width="32" className="md:w-9" />
          </a>
          <a href="https://github.com/fp-torres" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary transition-colors hover:-translate-y-1 transform duration-300">
            <Icon icon="mdi:github" width="32" className="md:w-9" />
          </a>
          <a href="https://instagram.com/fp.torresz" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary transition-colors hover:-translate-y-1 transform duration-300">
            <Icon icon="mdi:instagram" width="32" className="md:w-9" />
          </a>
          <a href="https://wa.me/5521967600280" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary transition-colors hover:-translate-y-1 transform duration-300">
            <Icon icon="mdi:whatsapp" width="32" className="md:w-9" />
          </a>
        </div>

        {/* ── Easter Egg Panel ── */}
        <div className="relative flex flex-col items-center justify-center mb-10 group">
          
          <p className="text-[10px] md:text-xs font-mono text-gray-500 mb-3 tracking-[0.2em] uppercase opacity-70 group-hover:opacity-100 transition-opacity">
            {isPt ? "[ Acesso Restrito ]" : "[ Restricted Access ]"}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-1.5 md:p-2 bg-black/40 border border-white/10 rounded-2xl md:rounded-full backdrop-blur-md hover:border-primary/40 transition-all duration-500 shadow-inner group-hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]">
            
            {/* NASA APOD */}
            <button 
              onClick={() => setIsNasaOpen(true)}
              className="relative flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-2.5 rounded-xl md:rounded-full text-gray-400 hover:text-white hover:bg-primary/20 transition-all duration-300 border border-transparent hover:border-primary/30"
              title={isPt ? "Ver imagem de hoje da NASA" : "View today's NASA image"}
            >
              <Icon icon="solar:satellite-bold-duotone" className="text-xl md:text-2xl text-primary" />
              <span className="font-mono text-[10px] md:text-xs font-bold tracking-widest hidden sm:block">LIVE_SIGNAL</span>
              <span className="font-mono text-[10px] font-bold tracking-widest sm:hidden">LIVE</span>
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>

            <div className="w-px h-8 bg-white/10 hidden sm:block" />

            {/* Time Machine */}
            <button 
              onClick={() => setIsTimeMachineOpen(true)}
              className="relative flex items-center justify-center gap-2 px-4 py-3 md:px-6 md:py-2.5 rounded-xl md:rounded-full text-gray-400 hover:text-white hover:bg-primary/20 transition-all duration-300 border border-transparent hover:border-primary/30"
              title={isPt ? "Viajar no tempo com a NASA" : "Time travel with NASA"}
            >
              <Icon icon="solar:telescope-bold-duotone" className="text-xl md:text-2xl text-primary" />
              <span className="font-mono text-[10px] md:text-xs font-bold tracking-widest hidden sm:block">TIME_TRAVEL</span>
              <span className="font-mono text-[10px] font-bold tracking-widest sm:hidden">TRAVEL</span>
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse blur-[1px]" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-yellow-300 rounded-full" />
            </button>

            <div className="w-px h-8 bg-white/10 hidden sm:block" />

            {/* Tech Radar — TechNews trigger is now self-contained inside TechNews */}
            <TechNews />

          </div>
        </div>

        {/* ── Copyright ── */}
        <div className="pt-8 border-t border-white/5">
          <p className="text-sm text-gray-500">{t.footer.copyright}</p>
        </div>
      </div>

      <NasaModal isOpen={isNasaOpen} onClose={() => setIsNasaOpen(false)} />
      <NasaTimeMachine isOpen={isTimeMachineOpen} onClose={() => setIsTimeMachineOpen(false)} />
      <CvModal isOpen={isCvModalOpen} onClose={() => setIsCvModalOpen(false)} />
    </footer>
  );
}