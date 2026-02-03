import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

export default function Hero() {
  const { t } = useLanguage();
  const [githubData, setGithubData] = useState(null);

  useEffect(() => {
    fetch('https://api.github.com/users/fp-torres')
      .then((res) => res.json())
      .then((data) => setGithubData(data))
      .catch((err) => console.error(err));
  }, []);

  const stats = githubData || { public_repos: 0, followers: 0, following: 0 };

  const BentoCard = ({ children, className = "" }) => (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`bg-surface/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:border-primary/30 transition-all duration-300 shadow-xl ${className}`}
    >
      {children}
    </motion.div>
  );

  return (
    <section id="hero" className="pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6">
          
          {/* 1. SUPER CARD DE PERFIL */}
          <BentoCard className="md:col-span-2 md:row-span-1 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group bg-gradient-to-br from-surface/60 to-black/40">
            
            {/* Foto e Status Corrigidos */}
            <div className="relative shrink-0 flex items-center justify-center">
                {/* Glow Proporcional Centralizado */}
                <div className="absolute inset-0 m-auto w-32 h-32 bg-primary/30 rounded-full blur-2xl group-hover:bg-primary/50 transition-all duration-500"></div>
                
                <div className="relative">
                    <img 
                        src={githubData?.avatar_url || t.hero.image} 
                        alt={t.hero.name} 
                        className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-surface object-cover shadow-2xl relative z-10"
                    />
                    
                    {/* --- Status Suave (3s) --- */}
                    <div className="absolute bottom-2 right-2 z-20">
                         <span 
                            className="absolute inline-flex h-5 w-5 rounded-full bg-green-500 opacity-75 animate-ping"
                            style={{ animationDuration: '3s' }}
                         ></span>
                         <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500 border-4 border-surface"></span>
                    </div>
                </div>
            </div>

            {/* Informações */}
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

                <div className="flex gap-3 justify-center md:justify-start">
                     <a href={t.hero.resumeLink} target="_blank" className="flex items-center gap-2 bg-primary text-bg font-bold px-5 py-2 rounded-full hover:bg-white transition-colors">
                        <Icon icon="solar:file-download-bold" /> {t.hero.ctaResume}
                    </a>
                    <a href="#contact" className="flex items-center gap-2 border border-white/20 text-white font-bold px-5 py-2 rounded-full hover:bg-white/10 transition-colors">
                        <Icon icon="solar:letter-bold" /> {t.nav.contact}
                    </a>
                </div>
            </div>

            {/* Decorativo Fundo */}
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
               <Icon icon="solar:code-square-bold" width="200" />
            </div>
          </BentoCard>

          {/* 2. CARD GITHUB */}
          <BentoCard className="md:col-span-1 md:row-span-2 flex flex-col justify-between bg-gradient-to-b from-surface/40 to-black/40">
            <div>
                <div className="flex items-center justify-between mb-6">
                    <Icon icon="mdi:github" width="44" className="text-white" />
                    <a href={githubData?.html_url} target="_blank" className="text-xs border border-white/20 px-3 py-1 rounded-full hover:bg-white hover:text-bg transition-colors text-white">
                        {t.hero.githubStats.profileBtn}
                    </a>
                </div>
                <div className="space-y-8">
                    <div>
                        <span className="text-5xl font-bold text-white block">{stats.public_repos}</span>
                        <span className="text-sm text-gray-400 uppercase tracking-wider">{t.hero.githubStats.repos}</span>
                        <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                            <motion.div initial={{ width: 0 }} whileInView={{ width: '70%' }} className="h-full bg-primary" />
                        </div>
                    </div>
                    <div>
                        <span className="text-5xl font-bold text-white block">{stats.followers}</span>
                        <span className="text-sm text-gray-400 uppercase tracking-wider">{t.hero.githubStats.followers}</span>
                        <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                             <motion.div initial={{ width: 0 }} whileInView={{ width: '40%' }} className="h-full bg-purple-500" />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10">
                 {/* Texto agora dinâmico (t.hero.recentActivity) */}
                 <p className="text-xs text-gray-500 mb-2">{t.hero.recentActivity}</p>
                 <div className="flex gap-1">
                    {[1,2,3,4,5,6,7].map(i => (
                        <div key={i} className={`w-full h-3 rounded-sm ${Math.random() > 0.5 ? 'bg-primary' : 'bg-white/10'}`}></div>
                    ))}
                 </div>
            </div>
          </BentoCard>

          {/* 3. CARD SOBRE */}
          <BentoCard className="md:col-span-1 md:row-span-1 flex flex-col justify-center">
             <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                {/* Texto agora dinâmico (t.hero.aboutTitle) */}
                <Icon icon="solar:user-id-bold" className="text-primary" /> {t.hero.aboutTitle}
             </h3>
             <p className="text-gray-300 text-sm leading-relaxed">
                {t.hero.aboutText}
             </p>
          </BentoCard>

          {/* 4. CARD ESPECIALIDADE */}
          <BentoCard className="md:col-span-1 md:row-span-1 flex flex-col justify-center relative overflow-hidden">
             <h4 className="text-white font-bold mb-4 relative z-10">{t.hero.currentFocus}</h4>
             <div className="flex flex-wrap gap-2 relative z-10">
                <span className="px-3 py-1 bg-blue-500/10 text-blue-300 text-xs rounded border border-blue-500/20 font-mono">React</span>
                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-300 text-xs rounded border border-yellow-500/20 font-mono">Node.js</span>
                <span className="px-3 py-1 bg-green-500/10 text-green-300 text-xs rounded border border-green-500/20 font-mono">API Rest</span>
                <span className="px-3 py-1 bg-purple-500/10 text-purple-300 text-xs rounded border border-purple-500/20 font-mono">Clean Code</span>
             </div>
          </BentoCard>

        </div>
      </div>
    </section>
  );
}