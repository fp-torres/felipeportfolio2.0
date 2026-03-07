import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

// Importação das Logos (Ajuste o caminho se a pasta for diferente)
import logoCrase from '../../assets/imgs/crase_sigma_logo.jpg';
import logoAllternativa from '../../assets/imgs/allternativa_filmes_x_logo.jpg';
import logoUva from '../../assets/imgs/uva_logo.jpg';
import logoSantoInacio from '../../assets/imgs/santoinaciorj_logo.jpg';

export default function Experience() {
  const { t } = useLanguage();

  // Lógica de fallback para o botão
  const viewDiplomaText = t.experience.viewDiploma || (t.nav.home === "Início" ? "Visualizar Diploma" : "View Diploma");

  // Funções para mapear o nome da empresa/escola para a logo correta
  const getCompanyLogo = (companyName) => {
    if (companyName.toLowerCase().includes("crase")) return logoCrase;
    if (companyName.toLowerCase().includes("allternativa")) return logoAllternativa;
    return null; // Retorna nulo se não achar, para usar o ícone padrão
  };

  const getSchoolLogo = (schoolName) => {
    if (schoolName.toLowerCase().includes("veiga") || schoolName.toLowerCase().includes("uva")) return logoUva;
    if (schoolName.toLowerCase().includes("inácio")) return logoSantoInacio;
    return null;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <section id="experience" className="py-24 relative border-t border-white/5 overflow-hidden">
      
      {/* Background Sutil */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* Header da Seção */}
      <div className="flex flex-col items-center mb-20 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-sm mb-4">
          <Icon icon="solar:cpu-bolt-bold" />
          <span>{"< Sys.History />"}</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight text-center">
          {t.experience.title}
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 md:gap-20 relative max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* === Coluna EXPERIÊNCIA === */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative z-10"
        >
          {/* Linha vertical principal */}
          <div className="absolute left-[15px] sm:left-[23px] top-2 bottom-0 w-[2px] bg-gradient-to-b from-primary via-white/10 to-transparent"></div>

          <div className="space-y-12">
            {t.experience.items.map((job) => {
              const Logo = getCompanyLogo(job.company);
              
              return (
                <motion.div 
                  key={job.id} 
                  variants={itemVariants}
                  className="relative pl-12 sm:pl-16 group"
                >
                  {/* Node da Timeline */}
                  <div className="absolute left-[9px] sm:left-[17px] top-8 w-3.5 h-3.5 bg-surface border-2 border-primary rounded-full group-hover:bg-primary transition-colors duration-300 z-10 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"></div>

                  {/* Card */}
                  <div className="relative bg-surface/40 backdrop-blur-md p-6 sm:p-7 rounded-xl border border-white/10 group-hover:border-primary/40 group-hover:-translate-y-1 shadow-xl hover:shadow-[0_8px_30px_rgba(var(--primary-rgb),0.1)] transition-all duration-300">
                      
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                              {/* Avatar da Empresa / Logo - Ajustado para preencher todo o espaço */}
                              <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center relative">
                                  {Logo ? (
                                      <img src={Logo} alt={job.company} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  ) : (
                                      <Icon icon={job.icon || "solar:briefcase-bold"} className="text-gray-400 text-2xl" />
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                              </div>
                              
                              <div className="min-w-0">
                                  <h4 className="text-xl md:text-2xl font-bold text-white group-hover:text-primary transition-colors leading-tight truncate">{job.role}</h4>
                                  {/* Classe truncate impede a quebra de linha */}
                                  <p className="text-sm text-gray-400 font-mono mt-1 truncate">@ {job.company}</p>
                              </div>
                          </div>
                          
                          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                              <span className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 bg-black/20 px-3 py-1 rounded border border-white/5 whitespace-nowrap">
                                  <Icon icon="solar:calendar-linear" /> {job.period}
                              </span>
                              {job.current && (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded border border-green-400/20 whitespace-nowrap">
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
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative z-10 lg:mt-0 mt-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-sm mb-8 lg:hidden ml-[15px] sm:ml-[23px]">
             <Icon icon="solar:book-bookmark-bold" />
             <span>{"< Education />"}</span>
          </div>

          <div className="absolute left-[15px] sm:left-[23px] top-2 bottom-0 w-[2px] bg-gradient-to-b from-blue-500 via-white/10 to-transparent"></div>

          <div className="space-y-12">
            {t.experience.education.map((edu) => {
              const Logo = getSchoolLogo(edu.school);

              return (
                <motion.div 
                  key={edu.id} 
                  variants={itemVariants}
                  className="relative pl-12 sm:pl-16 group"
                >
                  <div className="absolute left-[9px] sm:left-[17px] top-8 w-3.5 h-3.5 bg-surface border-2 border-blue-500 rounded-full group-hover:bg-blue-500 transition-colors duration-300 z-10 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>

                  <div className="relative bg-surface/40 backdrop-blur-md p-6 sm:p-7 rounded-xl border border-white/10 hover:border-blue-500/40 transition-all duration-300 shadow-xl hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)]">
                    
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-5">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Avatar da Instituição / Logo */}
                            <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center relative">
                                {Logo ? (
                                    <img src={Logo} alt={edu.school} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <Icon icon={edu.icon || "solar:diploma-bold"} className="text-blue-400 text-3xl" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>

                            <div className="min-w-0">
                                <h4 className="text-xl md:text-2xl font-bold text-white group-hover:text-blue-400 transition-colors leading-tight truncate">{edu.course}</h4>
                                <p className="text-sm text-gray-400 font-mono mt-1 truncate">{edu.school}</p>
                            </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
                            <span className="inline-flex items-center gap-2 text-xs font-mono text-gray-400 bg-black/20 px-3 py-1 rounded border border-white/5 whitespace-nowrap">
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
                                className="inline-flex items-center gap-2 text-xs font-mono font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500 px-3 py-1.5 rounded transition-all border border-blue-500/20"
                            >
                                <Icon icon="solar:verified-check-bold" className="text-sm" />
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