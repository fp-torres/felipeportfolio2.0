import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function NasaExplorer() {
  const { t } = useLanguage();
  const isPt = t.nav.home === "Início";
  
  const [data, setData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  // Chave pública da NASA (pode usar DEMO_KEY ou a sua própria)
  const NASA_KEY = "DEMO_KEY"; 

  useEffect(() => {
    fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro NASA API:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="py-20 flex justify-center">
      <Icon icon="svg-spinners:eclipse" className="text-4xl text-primary" />
    </div>
  );

  if (!data) return null;

  return (
    <section id="nasa" className="py-20 relative px-4 overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Header Estilo Centro de Comando */}
        <div className="flex flex-col items-center mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] tracking-[0.2em] uppercase mb-4">
               <Icon icon="solar:satellite-bold" />
               <span>Deep_Space_Relay</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
              NASA_DAILY_OBSERVATION
            </h2>
            <div className="w-16 h-1 bg-primary mt-4 rounded-full"></div>
        </div>

        {/* Card Principal */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative group rounded-3xl border border-white/10 bg-surface/20 backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          {/* Mídia da NASA */}
          <div className="aspect-video w-full overflow-hidden bg-black/40 relative">
             {data.media_type === "image" ? (
               <img 
                 src={data.url} 
                 alt={data.title} 
                 className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
               />
             ) : (
               <iframe src={data.url} className="w-full h-full" title="NASA Media" allowFullScreen />
             )}
             
             {/* Overlay de Scanlines Tech */}
             <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
          </div>

          {/* Conteúdo */}
          <div className="p-6 md:p-10">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
               <div className="min-w-0 flex-1">
                  <h3 className="text-xl md:text-3xl font-bold text-white leading-tight mb-3">
                    {data.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-primary font-mono text-[11px] font-bold border border-primary/30 px-2 py-0.5 rounded-md">
                      {data.date}
                    </span>
                    <span className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                      Origin: {data.copyright || "NASA Public Domain"}
                    </span>
                  </div>
               </div>
               
               <button 
                 onClick={() => setShowDetails(!showDetails)}
                 className="group/btn flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-primary border border-white/10 hover:border-primary rounded-2xl text-xs font-bold text-white hover:text-bg transition-all duration-300"
               >
                 <Icon icon={showDetails ? "solar:close-square-bold" : "solar: interplanetary-astronomics-bold"} className="text-xl" />
                 {isPt ? (showDetails ? "Fechar" : "Analisar Dados") : (showDetails ? "Close" : "Analyze Data")}
               </button>
            </div>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-8 pt-8 border-t border-white/5">
                    <p className="text-gray-400 text-sm md:text-base leading-relaxed font-light font-sans">
                      {data.explanation}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Logo NASA flutuante */}
          <div className="absolute top-6 right-6 p-2.5 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 z-20 shadow-xl group-hover:border-primary/50 transition-colors">
             <Icon icon="mdi:nasa" className="text-4xl text-white" />
          </div>
        </motion.div>
      </div>
      
      {/* Decoração de fundo (Blur Espacial) */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full -z-10"></div>
    </section>
  );
}