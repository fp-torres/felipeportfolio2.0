import { useLanguage } from '../../context/LanguageContext';
import { ArrowDownCircle, Mail } from 'lucide-react';
import { motion } from 'framer-motion'; // Para animações suaves

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section id="home" className="min-h-screen flex items-center justify-center pt-20 pb-10">
      <div className="flex flex-col-reverse md:flex-row items-center gap-12 w-full">
        
        {/* Lado do Texto */}
        <div className="flex-1 text-center md:text-left space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl md:text-2xl text-primary font-bold mb-2">
              {t.hero.title}
            </h2>
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-4">
              {t.hero.name}
            </h1>
            <div className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
              {t.hero.role}
            </div>
            <p className="text-muted text-lg max-w-lg mx-auto md:mx-0 mt-4 leading-relaxed">
              {t.hero.description}
            </p>
          </motion.div>

          {/* Botões */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4"
          >
            {/* Botão Currículo */}
            <a 
              href={t.hero.resumeLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-2 px-8 py-3 bg-primary text-bg font-bold rounded-full hover:bg-primary-600 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,209,0,0.3)]"
            >
              <ArrowDownCircle size={20} />
              {t.hero.ctaResume}
            </a>

            {/* Botão Contato */}
            <a 
              href="#contact" 
              className="group flex items-center justify-center gap-2 px-8 py-3 border border-primary text-primary font-bold rounded-full hover:bg-primary/10 hover:scale-105 transition-all duration-300"
            >
              <Mail size={20} />
              {t.hero.ctaContact}
            </a>
          </motion.div>
        </div>

        {/* Lado da Imagem (Foto) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex justify-center md:justify-end relative"
        >
          {/* Círculo decorativo atrás da foto */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full blur-3xl transform scale-90"></div>
          
          <div className="relative w-64 h-64 md:w-96 md:h-96 rounded-full p-2 border-2 border-primary/30 shadow-2xl bg-surface/50 backdrop-blur-sm">
             <img 
               src={t.hero.image} 
               alt={t.hero.name} 
               className="w-full h-full object-cover rounded-full hover:scale-[1.02] transition-transform duration-500 border border-white/10"
             />
          </div>
        </motion.div>

      </div>
    </section>
  );
}