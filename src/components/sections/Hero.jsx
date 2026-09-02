import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/useLanguage';
import { Icon } from '@iconify/react';
import { motion as Motion } from 'framer-motion';

import CvModal from '../CvModal';
import GithubContributions from './GithubContributions';

function BentoCard({ children, className = '' }) {
  return (
    <Motion.div
      whileHover={{ y: -5 }}
      className={`bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl p-5 sm:p-6 hover:border-primary/30 transition-all duration-300 shadow-xl ${className}`}
    >
      {children}
    </Motion.div>
  );
}

export default function Hero() {
  const { t } = useLanguage();
  const [githubData, setGithubData] = useState(null);

  const [isCvModalOpen, setIsCvModalOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchGithub = async () => {
      try {
        const profileResponse = await fetch('https://api.github.com/users/fp-torres', { signal: controller.signal });
        if (profileResponse.ok) {
          const profile = await profileResponse.json();
          setGithubData(profile);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          // Static fallback values keep the hero usable during API outages.
        }
      }
    };

    fetchGithub();
    return () => controller.abort();
  }, []);

  return (
    <section id="hero" className="pt-28 sm:pt-32 pb-12 sm:pb-20 px-1 sm:px-4">
      <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. SUPER CARD DE PERFIL */}
          <BentoCard className="md:col-span-2 md:row-span-1 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group bg-gradient-to-br from-surface/60 to-black/40">
            
            <div className="relative shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 m-auto w-32 h-32 bg-primary/30 rounded-full blur-2xl group-hover:bg-primary/50 transition-all duration-500"></div>
                <div className="relative">
                    <img 
                        src={githubData?.avatar_url || t.hero.image} 
                        alt={t.hero.name} 
                        fetchPriority="high"
                        className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-surface object-cover shadow-2xl relative z-10"
                    />
                    <div className="absolute bottom-2 right-2 z-20">
                         <span 
                            className="absolute inline-flex h-5 w-5 rounded-full bg-green-500 opacity-75 animate-ping"
                            style={{ animationDuration: '3s' }}
                         ></span>
                         <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500 border-4 border-surface"></span>
                    </div>
                </div>
            </div>

            <div className="text-center md:text-left z-10 flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                    {t.hero.name}
                </h1>
                <h2 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 mb-4">
                    {t.hero.role}
                </h2>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-gray-400 mb-6">
                    <span className="flex items-center gap-1">
                        <Icon icon="solar:map-point-bold" /> {t.hero.location}
                    </span>
                    <span className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full border border-green-400/20">
                        <Icon icon="solar:verified-check-bold" /> {t.hero.available}
                    </span>
                </div>

                <div className="flex flex-col xs:flex-row gap-3 justify-center md:justify-start">
                     <button 
                        onClick={() => setIsCvModalOpen(true)}
                        className="flex items-center gap-2 bg-primary text-bg font-bold px-5 py-2 rounded-full hover:bg-white transition-colors"
                     >
                        <Icon icon="solar:file-download-bold" /> {t.hero.ctaResume}
                    </button>
                    <a href="#contact" className="flex items-center gap-2 border border-white/20 text-white font-bold px-5 py-2 rounded-full hover:bg-white/10 transition-colors">
                        <Icon icon="solar:letter-bold" /> {t.nav.contact}
                    </a>
                </div>
            </div>

            <div className="hidden md:block absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
               <Icon icon="solar:code-square-bold" width="200" />
            </div>
          </BentoCard>

          {/* 2. CARD SOBRE */}
          <BentoCard className="md:col-span-1 flex flex-col justify-center">
             <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <Icon icon="solar:user-id-bold" className="text-primary" /> {t.hero.aboutTitle}
             </h3>
             <p className="text-gray-300 text-sm leading-relaxed">
                {t.hero.aboutText}
             </p>
          </BentoCard>

          {/* 3. CARD ESPECIALIDADE */}
          <BentoCard className="md:col-span-3 relative overflow-hidden flex flex-col justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>

             <h4 className="text-white font-bold mb-4 relative z-10 flex items-center gap-2">
                <Icon icon="solar:target-bold" className="text-blue-400 animate-pulse" />
                {t.hero.currentFocus}
             </h4>

             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg hover:bg-blue-500/20 transition-colors">
                    <Icon icon="devicon:python" width="20" />
                    <span className="text-blue-200 text-xs font-bold">Python</span>
                </div>
                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 p-2 rounded-lg hover:bg-orange-500/20 transition-colors">
                    <Icon icon="devicon:java" width="20" />
                    <span className="text-orange-200 text-xs font-bold">Java</span>
                </div>
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 p-2 rounded-lg hover:bg-green-500/20 transition-colors">
                    <Icon icon="solar:server-square-bold" className="text-green-400" width="20" />
                    <span className="text-green-200 text-xs font-bold">API Rest</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 p-2 rounded-lg hover:bg-purple-500/20 transition-colors">
                    <Icon icon="devicon:react" width="20" />
                    <span className="text-purple-200 text-xs font-bold">React</span>
                </div>
             </div>
          </BentoCard>

        </div>

        <div className="mt-6">
          <GithubContributions />
        </div>
      </div>

      <CvModal isOpen={isCvModalOpen} onClose={() => setIsCvModalOpen(false)} />
    </section>
  );
}
