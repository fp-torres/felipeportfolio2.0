import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';

// Importa os componentes
import NasaModal from '../NasaModal'; 
import NasaTimeMachine from '../NasaTimeMachine'; 
import TechNews from '../TechNews'; // Import do novo componente de notícias

export default function Footer() {
  const { t } = useLanguage();
  const [isNasaOpen, setIsNasaOpen] = useState(false);
  const [isTimeMachineOpen, setIsTimeMachineOpen] = useState(false);

  return (
    <footer id="contact" className="bg-surface relative pt-20 mt-20 border-t border-white/5 flex flex-col items-center">
      <div className="max-w-4xl w-full mx-auto px-6 text-center pb-10">
        
        <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">{t.footer.title}</h2>
            <p className="text-muted mb-8">{t.footer.subtitle}</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="mailto:felipetorresaraujo@gmail.com" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-bg font-bold rounded-full hover:bg-primary-600 transition-all hover:scale-105">
                    <Icon icon="solar:letter-bold" width="20" />
                    {t.footer.emailBtn}
                </a>
                
                <a href={t.hero.resumeLink} target="_blank" rel="noreferrer" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all hover:scale-105">
                    <Icon icon="solar:file-download-bold" width="20" />
                    {t.hero.ctaResume}
                </a>
            </div>
        </div>

        {/* Redes Sociais */}
        <div className="flex justify-center gap-6 md:gap-8 mb-12">
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

        {/* Gatilhos Secretos (Easter Eggs NASA) */}
        <div className="flex justify-center items-center gap-4 mb-6">
           {/* Satélite (Sinal de Hoje) */}
           <button 
             onClick={() => setIsNasaOpen(true)}
             className="opacity-10 hover:opacity-100 transition-opacity text-gray-600 hover:text-primary p-2 cursor-help"
             title="Deep Space Signal (Hoje)"
           >
             <Icon icon="solar:satellite-linear" className="text-xl animate-pulse" />
           </button>

           {/* Telescópio (Máquina do Tempo) */}
           <button 
             onClick={() => setIsTimeMachineOpen(true)}
             className="opacity-10 hover:opacity-100 transition-opacity text-gray-600 hover:text-primary p-2 cursor-help"
             title="Time Machine (NASA)"
           >
             <Icon icon="solar:telescope-linear" className="text-xl animate-pulse" style={{ animationDelay: '1s' }} />
           </button>
        </div>

        <div className="pt-8 border-t border-white/5">
            <p className="text-sm text-gray-500">
                {t.footer.copyright}
            </p>
        </div>
      </div>

      {/* Renders dos Modais */}
      <NasaModal isOpen={isNasaOpen} onClose={() => setIsNasaOpen(false)} />
      <NasaTimeMachine isOpen={isTimeMachineOpen} onClose={() => setIsTimeMachineOpen(false)} />
      
      {/* LETREIRO DE NOTÍCIAS AQUI - Base do Footer */}
      <TechNews />

    </footer>
  );
}