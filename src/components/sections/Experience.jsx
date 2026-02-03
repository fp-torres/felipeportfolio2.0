import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

export default function Experience() {
  const { t } = useLanguage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <section id="experience" className="py-24 relative">
      <div className="flex flex-col items-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold text-center flex items-center gap-3">
          <Icon icon="solar:suitcase-lines-bold-duotone" className="text-primary" />
          {t.experience.title}
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mt-4 rounded-full opacity-70"></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-16 relative">
        
        {/* === Coluna EXPERIÊNCIA === */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-8"
        >
          <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 border-l-4 border-primary pl-4">
             {t.experience.title}
          </h3>

          <div className="relative pl-4 sm:pl-0">
            <div className="absolute left-0 sm:left-4 top-2 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-transparent md:hidden"></div>

            {t.experience.items.map((job) => (
              <motion.div 
                key={job.id} 
                variants={itemVariants}
                className="relative mb-8 pl-8 sm:pl-0 group"
              >
                <div className="relative bg-surface/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-white/5 hover:border-primary/50 hover:bg-surface/80 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(255,209,0,0.1)] group-hover:-translate-y-1">
                    
                    {/* ÍCONE DA EMPRESA (Onde estava vazio) */}
                    <div className="absolute -left-3 -top-3 sm:-left-4 sm:-top-4 w-12 h-12 bg-surface border border-primary/30 rounded-full flex items-center justify-center shadow-lg z-10 group-hover:scale-110 transition-transform">
                         <Icon icon={job.icon || "solar:briefcase-bold"} className="text-primary text-2xl" />
                    </div>

                    {/* Badge "Atual" */}
                    <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                       {job.current && (
                           <span className="flex items-center gap-1 bg-primary text-bg text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                               <span className="w-2 h-2 bg-bg rounded-full"></span> Atualmente
                           </span>
                       )}
                    </div>

                    <h4 className="text-xl md:text-2xl font-bold text-white group-hover:text-primary transition-colors mt-2">{job.role}</h4>
                    <p className="text-lg text-gray-300 font-medium mb-4 flex items-center gap-2">
                        {job.company}
                    </p>
                    
                    <p className="text-gray-400 text-sm leading-relaxed mb-4 border-l-2 border-white/10 pl-4">
                        {job.description}
                    </p>

                    <div className="inline-flex items-center gap-2 text-xs font-mono text-primary bg-primary/10 px-3 py-1.5 rounded border border-primary/20">
                        <Icon icon="solar:calendar-bold" /> {job.period}
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* === Coluna FORMAÇÃO === */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-8"
        >
           <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 border-l-4 border-blue-500 pl-4">
             {t.experience.educationTitle}
          </h3>

           <div className="space-y-6">
            {t.experience.education.map((edu) => (
              <motion.div 
                key={edu.id} 
                variants={itemVariants}
                className="bg-surface/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 hover:border-blue-500/50 hover:bg-surface/80 transition-all duration-300 group flex flex-col sm:flex-row gap-4 items-start relative overflow-hidden"
              >
                {/* Ícone Grande (Corrigido para usar o ícone específico) */}
                <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <Icon icon={edu.icon || "solar:hat-graduation-bold"} size={32} />
                </div>

                <div className="flex-1">
                    <h4 className="text-lg md:text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{edu.course}</h4>
                    <p className="text-gray-400 text-sm mb-2">{edu.school}</p>
                    <span className="text-xs text-blue-400 font-mono block mb-4">{edu.period}</span>
                    
                    {edu.diploma && (
                        <a 
                            href={edu.diploma} 
                            target="_blank" 
                            className="inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600/20 hover:bg-blue-600 px-4 py-2 rounded-lg transition-all border border-blue-500/30 group-hover:border-blue-500"
                        >
                            <Icon icon="solar:diploma-verified-bold" />
                            Visualizar Diploma
                        </a>
                    )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}