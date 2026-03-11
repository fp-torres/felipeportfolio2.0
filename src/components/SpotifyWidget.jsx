import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export default function SpotifyWidget() {
  const { t } = useLanguage();
  const isPt = t.nav.home === "Início";
  const [spotifyData, setSpotifyData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const DISCORD_ID = "402555995462565891"; 

  useEffect(() => {
    const fetchMusicData = async () => {
      // --- TENTATIVA 1: PHP BRIDGE (API Oficial na Hostinger) ---
      try {
        // Se estiver local (localhost), tenta a 8000, mas em produção acessa direto o arquivo na raiz
        // Isso evita que AdBlocks barrem chamadas externas.
        const apiUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:8000/spotify.php' 
          : '/spotify.php'; // Caminho relativo perfeito para a Hostinger

        const resSpotify = await fetch(apiUrl);
        
        if (resSpotify.ok) {
          const data = await resSpotify.json();
          if (data && data.isPlaying === true) {
            setSpotifyData({
              song: data.title,
              artist: data.artist,
              album_art_url: data.albumImageUrl,
              url: data.songUrl
            });
            setIsPlaying(true);
            return; // Sucesso com PHP Oficial, ignora o Lanyard
          }
        }
      } catch (err) {
        console.warn("Aviso: PHP Bridge local não encontrado ou recusado. Tentando API do Discord...");
      }

      // --- TENTATIVA 2: LANYARD (DISCORD) ---
      // Lembrete: Se o seu AdBlock estiver muito agressivo, ele vai bloquear isso localmente.
      try {
        const resLanyard = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        
        if (resLanyard.ok) {
          const jsonLanyard = await resLanyard.json();
          if (jsonLanyard.success && jsonLanyard.data.listening_to_spotify) {
            const spot = jsonLanyard.data.spotify;
            setSpotifyData({
              song: spot.song,
              artist: spot.artist,
              album_art_url: spot.album_art_url,
              url: `https://open.spotify.com/track/$$${spot.track_id}` // Template literal corrigido
            });
            setIsPlaying(true);
            return;
          }
        }

        setIsPlaying(false);
        setSpotifyData(null);
      } catch (err) {
        console.error("Erro na API do Lanyard (Verifique se não foi bloqueado por AdBlock):", err);
        setIsPlaying(false);
        setSpotifyData(null);
      }
    };

    fetchMusicData();
    const interval = setInterval(fetchMusicData, 10000); 
    return () => clearInterval(interval);
  }, [DISCORD_ID]);

  return (
    <div className="fixed bottom-6 left-6 md:left-8 z-[60]">
      <AnimatePresence>
        {isPlaying && spotifyData && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            className="bg-[#0a0f1d]/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-[0_10px_40px_rgba(30,215,96,0.3)] flex items-center gap-4 max-w-[280px] sm:max-w-[320px] cursor-pointer group"
            onClick={() => window.open(spotifyData.url, '_blank')}
          >
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/5">
              <img 
                src={spotifyData.album_art_url} 
                alt="Album Art" 
                className="w-full h-full object-cover animate-[spin_15s_linear_infinite]" 
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                 <Icon icon="mdi:spotify" className="text-green-400 text-xl sm:text-2xl" />
              </div>
            </div>

            <div className="flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-green-400 tracking-widest flex items-center gap-1.5">
                  <span className="flex items-end gap-[2px] h-2.5">
                    <motion.span animate={{ height: ["40%", "100%", "40%"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-green-400 rounded-t-sm" />
                    <motion.span animate={{ height: ["100%", "50%", "100%"] }} transition={{ repeat: Infinity, duration: 0.9 }} className="w-0.5 bg-green-400 rounded-t-sm" />
                    <motion.span animate={{ height: ["60%", "100%", "60%"] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-green-400 rounded-t-sm" />
                  </span>
                  {isPt ? "Ouvindo Agora" : "Now Playing"}
                </span>
              </div>
              
              <h4 className="text-white text-xs sm:text-sm font-bold truncate leading-tight">
                {spotifyData.song}
              </h4>
              <p className="text-gray-400 text-[10px] sm:text-xs truncate font-mono mt-0.5 italic">
                {spotifyData.artist}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}