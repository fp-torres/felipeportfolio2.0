import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

// Importação das Logos
import logoCrase from '../../assets/imgs/crase_sigma_logo.jpg';
import logoAllternativa from '../../assets/imgs/allternativa_filmes_x_logo.jpg';
import logoUva from '../../assets/imgs/uva_logo.jpg';
import logoSantoInacio from '../../assets/imgs/santoinaciorj_logo.jpg';

export default function Experience() {
  const { t } = useLanguage();
  const viewDiplomaText = t.experience.viewDiploma || (t.nav.home === "Início" ? "Visualizar Diploma" : "View Diploma");

  const getCompanyLogo = (companyName) => {
    if (companyName.toLowerCase().includes("crase")) return logoCrase;
    if (companyName.toLowerCase().includes("allternativa")) return logoAllternativa;
    return null;
  };

  const getSchoolLogo = (schoolName) => {
    if (schoolName.toLowerCase().includes("veiga") || schoolName.toLowerCase().includes("uva")) return logoUva;
    if (schoolName.toLowerCase().includes("inácio")) return logoSantoInacio;
    return null;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <section id="experience" className="py-16 md:py-24 relative border-t border-white/5 overflow-hidden">
      
      {/* Background Sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] md:w-[600px] h-[300px] bg-primary/5 blur-[90px] md:blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* Header */}
      <div className="flex flex-col items-center mb-14 md:mb-20 relative z-10 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-xs md:text-sm mb-4">
          <Icon icon="solar:cpu-bolt-bold" />
          <span>{"< Sys.History />"}</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight text-center">
          {t.experience.title}
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-16 md:gap-12 lg:gap-16 relative max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* === Coluna EXPERIÊNCIA === */}
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="relative z-10">
          
          <div className="space-y-12 pl-6 sm:pl-8 md:pl-10 relative">
            {/* Trilho da Linha Vertical */}
            <div className="absolute left-0 top-2 bottom-0 w-[2px] bg-gradient-to-b from-primary via-white/10 to-transparent"></div>

            {t.experience.items.map((job) => {
              const Logo = getCompanyLogo(job.company);
              return (
                <motion.div key={job.id} variants={itemVariants} className="relative group">
                  
                  {/* Node da Timeline */}
                  <div className="absolute -left-[31px] sm:-left-[39px] md:-left-[47px] top-6 w-3.5 h-3.5 bg-surface border-2 border-primary rounded-full group-hover:bg-primary transition-colors duration-300 z-10 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"></div>

                  {/* Card */}
                  <div className="relative bg-surface/40 backdrop-blur-md p-5 sm:p-6 md:p-7 rounded-xl border border-white/10 group-hover:border-primary/40 transition-all duration-300 shadow-xl hover:shadow-[0_8px_30px_rgba(var(--primary-rgb),0.1)]">
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 flex-wrap">
                          
                          {/* Bloco Título + Logo */}
                          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-[200px]">
                              <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center relative p-1">
                                  {Logo ? (
                                      <img src={Logo} alt={job.company} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                                  ) : (
                                      <Icon icon={job.icon || "solar:briefcase-bold"} className="text-gray-400 text-2xl" />
                                  )}
                              </div>
                              
                              <div className="mt-1 sm:mt-0">
                                  <h4 className="text-base sm:text-lg md:text-xl font-bold text-white group-hover:text-primary transition-colors leading-tight break-words pr-2">{job.role}</h4>
                                  <p className="text-xs md:text-sm text-gray-400 font-mono mt-1 break-words">@ {job.company}</p>
                              </div>
                          </div>
                          
                          {/* Bloco Badges (Data e Atual) */}
                          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 shrink-0 w-full sm:w-auto">
                              <span className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-mono text-gray-400 bg-black/20 px-2.5 py-1 rounded border border-white/5 whitespace-nowrap">
                                  <Icon icon="solar:calendar-linear" /> {job.period}
                              </span>
                              {job.current && (
                                  <span className="inline-flex items-center gap-1.5 text-[9px] md:text-[10px] uppercase tracking-wider font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded border border-green-400/20 whitespace-nowrap">
                                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                      {t.nav.home === "Início" ? "Atual" : "Current"}
                                  </span>
                              )}
                          </div>
                      </div>
                      
                      <p className="text-gray-300 text-sm leading-relaxed font-sans mt-2">
                          {job.description}
                      </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* === Coluna FORMAÇÃO === */}
        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="relative z-10 lg:mt-0 mt-8">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-xs mb-8 lg:hidden ml-6 sm:ml-8 md:ml-10">
             <Icon icon="solar:book-bookmark-bold" />
             <span>{"< Education />"}</span>
          </div>

          <div className="space-y-12 pl-6 sm:pl-8 md:pl-10 relative">
            {/* Trilho da Linha Vertical */}
            <div className="absolute left-0 top-2 bottom-0 w-[2px] bg-gradient-to-b from-blue-500 via-white/10 to-transparent"></div>

            {t.experience.education.map((edu) => {
              const Logo = getSchoolLogo(edu.school);
              return (
                <motion.div key={edu.id} variants={itemVariants} className="relative group">
                  
                  {/* Node da Timeline */}
                  <div className="absolute -left-[31px] sm:-left-[39px] md:-left-[47px] top-6 w-3.5 h-3.5 bg-surface border-2 border-blue-500 rounded-full group-hover:bg-blue-500 transition-colors duration-300 z-10 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>

                  <div className="relative bg-surface/40 backdrop-blur-md p-5 sm:p-6 md:p-7 rounded-xl border border-white/10 hover:border-blue-500/40 transition-all duration-300 shadow-xl">
                    
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4 flex-wrap">
                        
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-[200px]">
                            <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center relative p-1">
                                {Logo ? (
                                    <img src={Logo} alt={edu.school} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <Icon icon={edu.icon || "solar:diploma-bold"} className="text-blue-400 text-2xl" />
                                )}
                            </div>

                            <div className="mt-1 sm:mt-0">
                                <h4 className="text-base sm:text-lg md:text-xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight break-words pr-2">{edu.course}</h4>
                                <p className="text-xs md:text-sm text-gray-400 font-mono mt-1 break-words">{edu.school}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 shrink-0 w-full sm:w-auto">
                            <span className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-mono text-gray-400 bg-black/20 px-2.5 py-1 rounded border border-white/5 whitespace-nowrap">
                                <Icon icon="solar:clock-circle-linear" /> {edu.period}
                            </span>
                        </div>
                    </div>

                    {edu.diploma && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <a 
                                href={edu.diploma} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center justify-center w-full sm:w-auto gap-2 text-[11px] md:text-xs font-mono font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500 px-4 py-2.5 rounded-lg transition-all border border-blue-500/20"
                            >
                                <Icon icon="solar:verified-check-bold" className="text-base" />
                                {viewDiplomaText}
                            </a>
                        </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

      </div>
    </section>
  );
}