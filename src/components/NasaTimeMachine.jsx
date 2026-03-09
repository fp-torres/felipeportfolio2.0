import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function NasaTimeMachine({ isOpen, onClose }) {
  const { t } = useLanguage();
  const isPt = t.nav.home === "Início";
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedData, setTranslatedData] = useState({ title: "", explanation: "" });
  
  // Inputs separados para formato Brasileiro DD/MM/AAAA
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const NASA_KEY = "cAush8xjdh5wW0Vos2wTwCMoGFZdUbRbVocSenOu";

  // Função para traduzir textos usando o Google
  const translateText = async (text) => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      const result = await response.json();
      return result[0].map(item => item[0]).join('');
    } catch (error) {
      console.error("Erro na tradução automática:", error);
      return text;
    }
  };

  const handleSearch = async () => {
    if (!day || !month || !year) {
      setErrorMsg(isPt ? "Preencha a data completa." : "Fill the complete date.");
      return;
    }

    const d = day.toString().padStart(2, '0');
    const m = month.toString().padStart(2, '0');
    const y = year.toString();

    const searchDate = `${y}-${m}-${d}`;
    const minDate = "1995-06-16";
    const today = new Date().toISOString().split("T")[0];

    // Validação de limites
    if (searchDate < minDate) {
       setErrorMsg(isPt ? "Os registros diários da NASA começaram em 16/06/1995. Tente uma data posterior!" : "NASA daily records started on 06/16/1995. Try a later date!");
       setData(null);
       return;
    }
    if (searchDate > today) {
       setErrorMsg(isPt ? "Ainda não podemos prever o futuro do universo!" : "We can't predict the future of the universe yet!");
       setData(null);
       return;
    }

    setLoading(true);
    setErrorMsg("");
    setTranslatedData({ title: "", explanation: "" });

    try {
      const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}&date=${searchDate}`);
      const json = await res.json();
      
      if (json.code) {
        setErrorMsg(json.msg || "Erro ao conectar com o arquivo da NASA.");
        setData(null);
      } else {
        setData(json);
        
        // Lógica de Tradução
        if (isPt) {
          setIsTranslating(true);
          const titlePt = await translateText(json.title);
          const explanationPt = await translateText(json.explanation);
          setTranslatedData({ title: titlePt, explanation: explanationPt });
          setIsTranslating(false);
        }
      }
    } catch (err) {
      console.error("NASA Time Machine Error:", err);
      setErrorMsg("Falha na conexão com os servidores de Houston.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Limpa tudo ao fechar o modal
  useEffect(() => {
    if (!isOpen) {
      setData(null);
      setErrorMsg("");
      setDay(""); setMonth(""); setYear("");
      setTranslatedData({ title: "", explanation: "" });
    }
  }, [isOpen]);

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
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="relative w-full max-w-3xl bg-surface border border-primary/30 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(var(--primary-rgb),0.15)] flex flex-col max-h-[90vh]"
          >
            {/* --- CABEÇALHO --- */}
            <div className="bg-primary/5 border-b border-primary/20 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shrink-0">
              
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <Icon icon="solar:history-bold" className="text-3xl text-primary" />
                </div>
                <div>
                    <h2 className="text-white font-bold text-xl leading-none uppercase tracking-widest">Cosmic_Archive</h2>
                    <p className="text-primary font-mono text-[10px] tracking-widest uppercase mt-1.5">
                      {isPt ? "Arquivo Histórico do Universo" : "Historical Universe Archive"}
                    </p>
                </div>
              </div>

              <button onClick={onClose} className="absolute top-5 right-5 sm:relative sm:top-0 sm:right-0 text-gray-400 hover:text-primary transition-colors shrink-0 bg-black/20 p-2 rounded-lg border border-white/5 hover:border-primary/50">
                <Icon icon="solar:close-square-bold" className="text-2xl" />
              </button>
            </div>

            {/* --- ÁREA DE INPUT (DATA DE NASCIMENTO) --- */}
            <div className="px-6 md:px-8 py-6 border-b border-white/5 bg-black/20 shrink-0">
               <p className="text-gray-300 text-sm mb-4 font-light text-center">
                 {isPt ? "O que a NASA estava observando no dia em que você nasceu? (A partir de Junho/1995)" : "What was NASA observing on the day you were born? (From June 1995)"}
               </p>
               
               <div className="flex flex-wrap items-center justify-center gap-3">
                  <input 
                    type="number" placeholder="DD" min="1" max="31"
                    value={day} onChange={e => setDay(e.target.value)}
                    className="w-16 bg-black/40 border border-primary/30 text-white text-center font-mono text-lg px-2 py-3 rounded-xl focus:outline-none focus:border-primary transition-colors placeholder:text-gray-600"
                  />
                  <span className="text-primary font-bold text-xl">/</span>
                  <input 
                    type="number" placeholder="MM" min="1" max="12"
                    value={month} onChange={e => setMonth(e.target.value)}
                    className="w-16 bg-black/40 border border-primary/30 text-white text-center font-mono text-lg px-2 py-3 rounded-xl focus:outline-none focus:border-primary transition-colors placeholder:text-gray-600"
                  />
                  <span className="text-primary font-bold text-xl">/</span>
                  <input 
                    type="number" placeholder="AAAA" min="1995" max={new Date().getFullYear()}
                    value={year} onChange={e => setYear(e.target.value)}
                    className="w-24 bg-black/40 border border-primary/30 text-white text-center font-mono text-lg px-2 py-3 rounded-xl focus:outline-none focus:border-primary transition-colors placeholder:text-gray-600"
                  />
                  
                  <button 
                    onClick={handleSearch}
                    disabled={loading || isTranslating}
                    className="ml-2 bg-primary text-bg font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {loading || isTranslating ? <Icon icon="svg-spinners:pulse-rings-multiple" className="text-xl" /> : <Icon icon="solar:telescope-bold" className="text-xl" />}
                    {isPt ? "Viajar no Tempo" : "Time Travel"}
                  </button>
               </div>
            </div>

            {/* --- CONTEÚDO / RESULTADO --- */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-black/10">
              {loading || isTranslating ? (
                <div className="h-48 flex flex-col items-center justify-center text-primary gap-4">
                   <p className="font-mono text-xs animate-pulse tracking-widest uppercase">
                     {isTranslating ? (isPt ? "Traduzindo dados dos arquivos espaciais..." : "Translating space archives...") : (isPt ? "Viajando pelos arquivos espaciais..." : "Traveling through space archives...")}
                   </p>
                </div>
              ) : errorMsg ? (
                <div className="h-48 flex flex-col items-center justify-center text-red-400 gap-4">
                   <Icon icon="solar:danger-triangle-bold" className="text-5xl" />
                   <p className="font-mono text-sm text-center max-w-md">{errorMsg}</p>
                </div>
              ) : data ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  
                  {/* CAIXA EXPLICATIVA PARA LEIGOS */}
                  <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3">
                    <Icon icon="solar:info-circle-bold-duotone" className="text-purple-400 text-2xl shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-purple-400 font-bold text-sm uppercase tracking-wider mb-1">
                        {isPt ? "Neste dia da história espacial:" : "On this day in space history:"}
                      </h4>
                      <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
                        {isPt 
                          ? `No dia ${day}/${month}/${year}, a NASA selecionou este registro visual específico como o mais fascinante do universo. A explicação abaixo foi escrita por um astrônomo na época.` 
                          : `On ${month}/${day}/${year}, NASA selected this specific visual record as the most fascinating in the universe. The explanation below was written by an astronomer at the time.`}
                      </p>
                    </div>
                  </div>

                  {/* Container da Mídia (Imagem ou Vídeo) */}
                  <div className="relative rounded-2xl overflow-hidden mb-6 border border-white/10 bg-black shadow-inner flex justify-center items-center h-[30vh] md:h-[40vh] group">
                    {data.media_type === "image" ? (
                      <a href={data.hdurl || data.url} target="_blank" rel="noreferrer" title={isPt ? "Ver imagem original em HD" : "View original HD image"}>
                         <img src={data.url} alt={displayTitle} className="max-w-full max-h-full object-contain transition-transform duration-700 hover:scale-[1.02] cursor-zoom-in" />
                      </a>
                    ) : (
                      <iframe src={data.url} className="w-full h-full" allowFullScreen></iframe>
                    )}
                  </div>
                  
                  {/* Dados Históricos */}
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">{displayTitle}</h3>
                    <div className="flex items-center gap-3 mb-6">
                       <span className="text-primary font-mono text-xs font-bold bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
                          LOG DATE: {data.date}
                       </span>
                       {data.copyright && (
                          <span className="text-gray-500 font-mono text-[10px] uppercase">
                             © {data.copyright}
                          </span>
                       )}
                    </div>
                    
                    <div className="bg-black/40 p-5 md:p-6 rounded-2xl border border-white/5 relative">
                      <p className="text-gray-300 text-sm md:text-base leading-relaxed font-light">
                        {displayExplanation}
                      </p>
                    </div>

                    <p className="mt-6 text-[10px] text-gray-500 italic text-center font-mono">
                      {isPt ? "* Texto original fornecido em Inglês pela NASA. Traduzido automaticamente." : "* Original text provided by NASA API."}
                    </p>
                  </div>

                </motion.div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-gray-600 gap-4 opacity-50">
                   <Icon icon="solar:stars-line-duotone" className="text-6xl" />
                   <p className="font-mono text-xs uppercase tracking-widest text-center">
                     {isPt ? "Aguardando coordenadas de nascimento..." : "Awaiting birth coordinates..."}
                   </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}