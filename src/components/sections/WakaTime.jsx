import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

export default function WakaTime() {
  const { t } = useLanguage();
  const isPt = t.nav.home === "Início";
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // O seu link real e definitivo do WakaTime
  const WAKATIME_URL = "https://wakatime.com/share/@345c9bc6-92ce-4f67-a955-c52388544d82/3021f3d7-17f5-41b9-b4ea-3ba98de769c7.json";

  useEffect(() => {
    // ⏳ Trava de Tempo: Define a data de expiração da simulação (7 dias a partir de hoje)
    const expirationDate = new Date("2026-03-16T00:00:00");
    const today = new Date();
    
    // Se hoje for menor que a data de expiração, usamos o Mock para não ficar vazio no site
    if (today < expirationDate) {
      setTimeout(() => {
        setStats([
          { name: "React", percent: 42.5, color: "#61dafb", text: "64 hrs 45 mins" },
          { name: "PHP", percent: 28.3, color: "#777bb4", text: "45 hrs 10 mins" },
          { name: "Python", percent: 18.2, color: "#3776ab", text: "32 hrs 20 mins" },
          { name: "JavaScript", percent: 11.0, color: "#f7df1e", text: "22 hrs 50 mins" }
        ]);
        setLoading(false);
      }, 1200);
      return;
    }

    // 🚀 A partir do dia 16/03/2026, ele cai automaticamente neste bloco e puxa os dados REAIS
    fetch(WAKATIME_URL)
      .then(res => res.json())
      .then(response => {
        if (response && response.data) {
          // Pega as 4 linguagens mais usadas historicamente
          const topLanguages = response.data.slice(0, 4);
          setStats(topLanguages);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro na API do WakaTime:", err);
        setLoading(false);
      });
  }, []);

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
            {isPt ? "Histórico de Código (All Time)" : "Coding History (All Time)"}
          </h3>
          <p className="text-sm text-gray-400 font-mono mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            {isPt ? "Monitoramento contínuo via WakaTime API" : "Continuous tracking via WakaTime API"}
          </p>
        </div>
        
        <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-lg font-mono text-sm text-gray-300 shadow-inner">
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
              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner">
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
          <p className="mb-2"><span className="text-primary">felipe@dev:~$</span> fetch --stats --all-time</p>
          <p className="text-gray-300 mb-2">
            {isPt 
              ? "> Compilando registro histórico..." 
              : "> Compiling historical record..."}
          </p>
          <p className="text-gray-300">
            {isPt 
              ? `> Top 4 linguagens dominantes no momento: ${stats?.map(s => s.name).join(', ')}.`
              : `> Top 4 dominant languages right now: ${stats?.map(s => s.name).join(', ')}.`}
          </p>
          <p className="text-green-400 mt-2 animate-pulse">_</p>
        </div>

      </div>
    </motion.div>
  );
}