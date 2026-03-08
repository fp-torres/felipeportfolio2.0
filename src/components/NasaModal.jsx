import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function NasaModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const isPt = t.nav.home === "Início";
  const [data, setData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY`)
        .then(res => res.json())
        .then(json => setData(json))
        .catch(err => console.error("NASA Error:", err));
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg/95 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="relative w-full max-w-2xl bg-surface border border-primary/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)]"
          >
            {/* Barra de Status do Sistema */}
            <div className="bg-primary/10 border-b border-primary/20 p-3 flex justify-between items-center px-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-mono text-[10px] text-primary tracking-widest uppercase">
                  {isPt ? "Sinal Interceptado: Houston/EUA" : "Signal Intercepted: Houston/USA"}
                </span>
              </div>
              <button onClick={onClose} className="text-primary hover:scale-110 transition-transform">
                <Icon icon="solar:close-circle-bold" className="text-2xl" />
              </button>
            </div>

            {data ? (
              <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="rounded-2xl overflow-hidden mb-6 border border-white/10 aspect-video">
                  {data.media_type === "image" ? (
                    <img src={data.url} alt={data.title} className="w-full h-full object-cover" />
                  ) : (
                    <iframe src={data.url} className="w-full h-full" allowFullScreen></iframe>
                  )}
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{data.title}</h3>
                <p className="text-primary font-mono text-xs mb-4">{data.date} // APOD_DATA_STREAM</p>
                
                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                  <p className="text-gray-400 text-sm leading-relaxed font-light">
                    <span className="text-primary font-bold">LOG:</span> {data.explanation}
                  </p>
                </div>

                <p className="mt-4 text-[10px] text-gray-500 italic text-center">
                  {isPt ? "* Dados originais fornecidos em Inglês pela NASA API" : "* Original data provided in English by NASA API"}
                </p>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <Icon icon="svg-spinners:90-ring-with-bg" className="text-4xl text-primary" />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}