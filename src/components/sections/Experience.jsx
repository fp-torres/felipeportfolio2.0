import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

export default function Experience() {
  const { t } = useLanguage();

  // Lógica segura para traduzir o botão sem precisar alterar o content.js
  const viewDiplomaText = t.experience.viewDiploma || (t.nav.home === "Início" ? "Visualizar Diploma" : "View Diploma");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, type: "spring", stiffness: 100 } }
  };

  return (
    <section id="experience" className="py-24 relative overflow-hidden">
      
      {/* Elementos visuais de fundo */}
      <div className="absolute top-40 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-40 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

      <div className="flex flex-col items-center mb-16 relative z-10">
        <h2 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 flex items-center gap-3">
          <Icon icon="solar:suitcase-lines-bold-duotone" className="text-primary" />
          {t.experience.title}
        </h2>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mt-4 rounded-full opacity-70"></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-16 relative max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* === Coluna EXPERIÊNCIA (Timeline) === */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="relative"
        >
          <h3 className="text-2xl font-bold text-white mb-10 flex items-center gap-3 border-l-4 border-primary pl-4 bg-gradient-to-r from-primary/10 to-transparent py-2 rounded-r-lg">
             {t.experience.title}
          </h3>

          <div className="relative border-l-2 border-primary/20 ml-3 sm:ml-4 space-y-10">
            {t.experience.items.map((job) => (
              <motion.div 
                key={job.id} 
                variants={itemVariants}
                className="relative pl-8 sm:pl-10 group"
              >
                {/* Ponto na Linha do Tempo */}
                <div className="absolute -left-[25px] sm:-left-[26px] top-6 w-12 h-12 bg-[#0F172A] border-2 border-primary rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] group-hover:scale-110 group-hover:bg-primary transition-all duration-300 z-10">
                    <Icon icon={job.icon || "solar:briefcase-bold"} className="text-primary group-hover:text-bg text-xl transition-colors" />
                </div>

                {/* Card de Experiência */}
                <div className="relative bg-gradient-to-br from-surface/80 to-surface/30 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/10 hover:border-primary/50 transition-all duration-500 shadow-xl hover:shadow-[0_10_40px_rgba(255,209,0,0.15)] overflow-hidden">
                    
                    {/* Brilho de fundo no hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Badge "Atual" */}
                    {job.current && (
                        <div className="absolute top-0 right-0 bg-primary text-bg text-xs font-extrabold px-4 py-1.5 rounded-bl-2xl rounded-tr-xl shadow-lg flex items-center gap-2">
                            <span className="w-2 h-2 bg-bg rounded-full animate-pulse"></span> {t.nav.home === "Início" ? "Atualmente" : "Present"}
                        </div>
                    )}

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 text-xs font-mono text-primary mb-3 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                            <Icon icon="solar:calendar-bold" /> {job.period}
                        </div>
                        
                        <h4 className="text-xl md:text-2xl font-bold text-white group-hover:text-primary transition-colors">{job.role}</h4>
                        <p className="text-lg text-gray-400 font-medium mb-4 flex items-center gap-2">
                            {job.company}
                        </p>
                        
                        <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-white/10 pl-4">
                            {job.description}
                        </p>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* === Coluna FORMAÇÃO (Cards Bento) === */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="space-y-8"
        >
           <h3 className="text-2xl font-bold text-white mb-10 flex items-center gap-3 border-l-4 border-blue-500 pl-4 bg-gradient-to-r from-blue-500/10 to-transparent py-2 rounded-r-lg">
             {t.experience.educationTitle}
          </h3>

           <div className="space-y-6">
            {t.experience.education.map((edu) => (
              <motion.div 
                key={edu.id} 
                variants={itemVariants}
                className="bg-gradient-to-br from-surface/80 to-surface/30 backdrop-blur-md p-6 rounded-3xl border border-white/10 hover:border-blue-500/40 transition-all duration-500 group flex flex-col sm:flex-row gap-6 items-start relative overflow-hidden shadow-xl hover:shadow-[0_10_40px_rgba(59,130,246,0.15)] hover:-translate-y-1"
              >
                {/* Efeito de luz varrendo o card */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>

                {/* Ícone com Gradient e Sombra */}
                <div className="shrink-0 p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl text-blue-400 group-hover:from-blue-500 group-hover:to-purple-500 group-hover:text-white transition-all duration-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] relative z-10">
                    <Icon icon={edu.icon || "solar:hat-graduation-bold"} size={32} />
                </div>

                <div className="flex-1 relative z-10">
                    <h4 className="text-lg md:text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{edu.course}</h4>
                    <p className="text-gray-400 text-sm mb-2">{edu.school}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-4">
                        <span className="text-xs text-blue-300 font-mono bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                            {edu.period}
                        </span>
                        
                        {edu.diploma && (
                            <a 
                                href={edu.diploma} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600/20 hover:bg-blue-600 px-4 py-1.5 rounded-full transition-all border border-blue-500/30 group-hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                            >
                                <Icon icon="solar:diploma-verified-bold" className="text-lg" />
                                {viewDiplomaText}
                            </a>
                        )}
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}