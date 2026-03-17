import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useLanguage } from '../context/LanguageContext';

export default function CvModal({ isOpen, onClose }) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const ModalCard = ({ title, desc, link, image }) => (
    <a 
      href={link} 
      target="_blank" 
      rel="noreferrer"
      className="group relative flex flex-col items-center text-center p-4 md:p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1 md:hover:-translate-y-2 bg-surface/40 border-white/10 hover:border-primary/50 hover:bg-surface/80 shadow-xl"
    >
      {/* Container da Imagem responsivo (menor no mobile) */}
      <div className="w-[130px] sm:w-[160px] md:w-[220px] aspect-[1/1.4] bg-[#1a1a1a] rounded-lg mb-4 md:mb-5 overflow-hidden border border-white/10 relative shadow-md group-hover:shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] transition-all flex items-center justify-center shrink-0">
         
         <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none"></div>
         
         <img 
            src={image} 
            alt={`Preview ${title}`} 
            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
         />
         
         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
            <div className="bg-primary/90 text-bg p-2 md:p-3 rounded-full backdrop-blur-sm shadow-lg">
                <Icon icon="solar:download-minimalistic-bold" className="text-xl md:text-2xl" />
            </div>
         </div>
      </div>

      <h4 className="text-white font-bold text-base md:text-lg mb-1 md:mb-2">{title}</h4>
      <p className="text-gray-400 text-xs md:text-sm leading-relaxed mb-3 md:mb-4 flex-grow">{desc}</p>
      
      <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary mt-auto">
        {t.hero.ctaResume}
      </div>
    </a>
  );

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          // Aqui está o segredo do mobile: max-h-[90vh] e overflow-y-auto
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-hidden bg-[#0a0f1d] border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-10 shadow-2xl custom-scrollbar"
        >
          {/* Efeito de luz de fundo */}
          <div className="absolute -top-10 -right-10 md:-top-20 md:-right-20 w-64 h-64 md:w-96 md:h-96 bg-primary/10 rounded-full blur-[80px] md:blur-[100px] pointer-events-none"></div>

          {/* Botão Fechar ajustado para não colar muito no topo no mobile */}
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors z-30"
          >
            <Icon icon="solar:close-circle-bold" className="text-xl md:text-2xl" />
          </button>

          <div className="text-center mb-6 md:mb-8 relative z-20 mt-2 md:mt-0">
            <h3 className="text-xl md:text-3xl font-bold text-white mb-2 pr-6 md:pr-0">
              {t.cvModal.title}
            </h3>
            <p className="text-gray-400 text-xs md:text-base max-w-lg mx-auto">
              {t.cvModal.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative z-20">
            <ModalCard 
              title={t.cvModal.modern.title}
              desc={t.cvModal.modern.desc}
              link={t.cvModal.modern.link}
              image={t.cvModal.modern.image}
            />
            <ModalCard 
              title={t.cvModal.corporate.title}
              desc={t.cvModal.corporate.desc}
              link={t.cvModal.corporate.link}
              image={t.cvModal.corporate.image}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}