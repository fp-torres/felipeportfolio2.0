import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function WakaTime() {
  const { t } = useLanguage();
  const isPt = t.nav.home === "Início";
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔴 COLE AQUI O SEU LINK JSON DO WAKATIME (Linguagens):
  // Ex: "https://wakatime.com/share/@seu_user/seu_id.json"
  const WAKATIME_URL = ""; 

  useEffect(() => {
    if (!WAKATIME_URL) {
      // Se não tiver URL, mostra um Mock de visualização
      setTimeout(() => {
        setStats([
          { name: "React", percent: 45.2, color: "#61dafb", text: "18 hrs 45 mins" },
          { name: "JavaScript", percent: 25.1, color: "#f7df1e", text: "10 hrs 12 mins" },
          { name: "Python", percent: 15.4, color: "#3776ab", text: "6 hrs 20 mins" },
          { name: "PHP", percent: 14.3, color: "#777bb4", text: "5 hrs 50 mins" }
        ]);
        setLoading(false);
      }, 1500);
      return;
    }

    // Busca os dados reais da API do WakaTime
    fetch(WAKATIME_URL)
      .then(res => res.json())
      .then(response => {
        // O WakaTime retorna um array em response.data
        // Pegamos os 4 principais para não quebrar o layout
        const topLanguages = response.data.slice(0, 4);
        setStats(topLanguages);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro WakaTime:", err);
        setLoading(false);
      });
  }, [WAKATIME_URL]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-surface/40 backdrop-blur-md rounded-2xl border border-white/10 p-8 flex justify-center items-center h-40 shadow-xl">
        <Icon icon="solar:programming-bold" className="text-4xl text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full max-w-4xl mx-auto bg-[#0a0f1d] rounded-2xl border border-white/5 p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors"
    >
      {/* Luz de fundo tech */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 relative z-10 gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <Icon icon="solar:code-square-bold" className="text-primary" />
            {isPt ? "Atividade de Código (Últimos 7 dias)" : "Coding Activity (Last 7 days)"}
          </h3>
          <p className="text-sm text-gray-400 font-mono mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            {isPt ? "Rastreado em tempo real via WakaTime API" : "Tracked in real-time via WakaTime API"}
          </p>
        </div>
        
        <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-lg font-mono text-sm text-gray-300">
           <span className="text-primary">{"<"}</span> API.Status: <span className="text-green-400">200_OK</span> <span className="text-primary">{"/>"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        
        {/* Barras de Progresso das Linguagens */}
        <div className="space-y-5">
          {stats?.map((lang, index) => (
            <div key={index}>
              <div className="flex justify-between items-end mb-2">
                <span className="text-white font-bold">{lang.name}</span>
                <span className="text-xs text-gray-400 font-mono">{lang.text || `${lang.percent}%`}</span>
              </div>
              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  whileInView={{ width: `${lang.percent}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: lang.color || "#FFD100", opacity: 0.9 }}
                ></motion.div>
              </div>
            </div>
          ))}
        </div>

        {/* Card de Informação Adicional / Terminal Falso */}
        <div className="bg-black/60 border border-white/5 rounded-xl p-5 font-mono text-sm text-gray-400 flex flex-col justify-center shadow-inner">
          <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <p className="mb-2"><span className="text-primary">felipe@dev:~$</span> fetch --stats</p>
          <p className="text-gray-300 mb-2">
            {isPt 
              ? "> Compilando dados de produtividade..." 
              : "> Compiling productivity data..."}
          </p>
          <p className="text-gray-300">
            {isPt 
              ? `> Principais linguagens focadas recentemente: ${stats?.map(s => s.name).join(', ')}.`
              : `> Top focused languages recently: ${stats?.map(s => s.name).join(', ')}.`}
          </p>
          <p className="text-green-400 mt-2 animate-pulse">_</p>
        </div>

      </div>
    </motion.div>
  );
}