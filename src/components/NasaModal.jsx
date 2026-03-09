import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function NasaModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const isPt = t.nav.home === "Início";
  
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedData, setTranslatedData] = useState({ title: "", explanation: "" });

  const NASA_KEY = "cAush8xjdh5wW0Vos2wTwCMoGFZdUbRbVocSenOu";

  // Função para traduzir textos usando um endpoint público do Google
  const translateText = async (text) => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      const result = await response.json();
      // O Google retorna um array de arrays, precisamos mapear e juntar as frases
      return result[0].map(item => item[0]).join('');
    } catch (error) {
      console.error("Erro na tradução automática:", error);
      return text; // Se a tradução falhar, devolve em inglês por segurança
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setData(null);
      setTranslatedData({ title: "", explanation: "" });
      
      fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`)
        .then(res => res.json())
        .then(async json => {
            if (json.code) {
                setErrorMsg(json.msg || "Erro ao conectar com a NASA.");
            } else {
                setData(json);
                
                // Lógica de Tradução Dinâmica
                if (isPt) {
                  setIsTranslating(true);
                  const titlePt = await translateText(json.title);
                  const explanationPt = await translateText(json.explanation);
                  setTranslatedData({ title: titlePt, explanation: explanationPt });
                  setIsTranslating(false);
                }
            }
        })
        .catch(err => {
            console.error("NASA Error:", err);
            setErrorMsg("Falha na interceptação do sinal.");
        });
    }
  }, [isOpen, isPt]); // Adicionamos isPt na dependência para re-traduzir se ele mudar o idioma com o modal aberto

  // Define qual texto exibir com base no idioma
  const displayTitle = isPt && translatedData.title ? translatedData.title : data?.title;
  const displayExplanation = isPt && translatedData.explanation ? translatedData.explanation : data?.explanation;

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
            className="relative w-full max-w-2xl bg-surface border border-primary/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)] flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-primary/10 border-b border-primary/20 p-3 flex justify-between items-center px-6 shrink-0">
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

            {errorMsg ? (
               <div className="h-64 flex flex-col items-center justify-center text-red-400 gap-4">
                  <Icon icon="solar:danger-triangle-bold" className="text-5xl" />
                  <p className="font-mono text-sm">{errorMsg}</p>
               </div>
            ) : !data || isTranslating ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4">
                <Icon icon="svg-spinners:90-ring-with-bg" className="text-4xl text-primary" />
                <p className="font-mono text-xs text-primary animate-pulse tracking-widest uppercase">
                  {isPt ? (isTranslating ? "Traduzindo dados espaciais..." : "Baixando imagem da NASA...") : "Downloading NASA feed..."}
                </p>
              </div>
            ) : (
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                
                {/* CAIXA EXPLICATIVA PARA LEIGOS */}
                <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                  <Icon icon="solar:info-circle-bold-duotone" className="text-blue-400 text-2xl shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-blue-400 font-bold text-sm uppercase tracking-wider mb-1">
                      {isPt ? "O que é isso?" : "What is this?"}
                    </h4>
                    <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
                      {isPt 
                        ? "Todos os dias, a NASA publica uma imagem diferente do nosso universo junto com uma explicação escrita por um astrônomo profissional. Este terminal intercepta a foto oficial de hoje." 
                        : "Each day a different image or photograph of our fascinating universe is featured, along with a brief explanation written by a professional astronomer."}
                    </p>
                  </div>
                </div>

                {/* MÍDIA (FOTO/VÍDEO) */}
                <div className="rounded-2xl overflow-hidden mb-6 border border-white/10 bg-black flex justify-center items-center h-[30vh] md:h-[40vh] relative group">
                  {data.media_type === "image" ? (
                    <a href={data.hdurl || data.url} target="_blank" rel="noreferrer" title={isPt ? "Ver imagem original em HD" : "View HD image"}>
                      <img src={data.url} alt={displayTitle} className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-[1.02] cursor-zoom-in" />
                    </a>
                  ) : (
                    <iframe src={data.url} className="w-full h-full" allowFullScreen></iframe>
                  )}
                </div>
                
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{displayTitle}</h3>
                
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-primary font-mono text-xs font-bold bg-primary/10 px-2 py-1 rounded border border-primary/20 flex items-center gap-1.5">
                    <Icon icon="solar:calendar-date-bold" />
                    {data.date}
                  </span>
                  <span className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                    // APOD_DATA_STREAM
                  </span>
                </div>
                
                <div className="bg-black/40 p-5 rounded-xl border border-white/5 relative">
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed font-light">
                    <span className="text-primary font-bold">LOG:</span> {displayExplanation}
                  </p>
                </div>

                <p className="mt-6 text-[10px] text-gray-500 italic text-center font-mono">
                  {isPt ? "* Texto original fornecido em Inglês pela NASA. Traduzido automaticamente." : "* Original text provided by NASA API."}
                </p>

              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}