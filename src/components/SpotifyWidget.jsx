import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SpotifyWidget() {
  const [spotifyData, setSpotifyData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Seu ID numérico real extraído do sinal Lanyard
  const DISCORD_ID = "402555995462565891"; 

  useEffect(() => {
    const fetchSpotify = async () => {
      try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const json = await res.json();
        
        // Verifica se a resposta foi bem-sucedida e se você está ouvindo música
        if (json.success && json.data.listening_to_spotify) {
          setSpotifyData(json.data.spotify);
          setIsPlaying(true);
        } else {
          setIsPlaying(false);
          setSpotifyData(null);
        }
      } catch (err) {
        console.error("Erro na comunicação com Lanyard:", err);
      }
    };

    fetchSpotify();
    // Atualiza a cada 5 segundos para acompanhar a troca de faixas
    const interval = setInterval(fetchSpotify, 5000);
    return () => clearInterval(interval);
  }, [DISCORD_ID]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isPlaying && spotifyData && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            className="bg-[#0a0f1d]/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-[0_10px_40px_rgba(30,215,96,0.3)] flex items-center gap-4 max-w-[280px] sm:max-w-[320px] cursor-pointer"
            onClick={() => window.open(`https://open.spotify.com/track/${spotifyData.track_id}`, '_blank')}
          >
            {/* Capa do Álbum Giratória estilo Vinil */}
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl overflow-hidden shadow-lg border border-white/5">
              <img 
                src={spotifyData.album_art_url} 
                alt={spotifyData.album} 
                className="w-full h-full object-cover animate-[spin_15s_linear_infinite]" 
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                 <Icon icon="mdi:spotify" className="text-green-400 text-xl sm:text-2xl" />
              </div>
            </div>

            <div className="flex flex-col min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-green-400 tracking-widest flex items-center gap-1.5">
                  <span className="flex items-end gap-[2px] h-2.5">
                    <motion.span animate={{ height: ["40%", "100%", "40%"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-green-400 rounded-t-sm"></motion.span>
                    <motion.span animate={{ height: ["70%", "30%", "70%"] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-0.5 bg-green-400 rounded-t-sm"></motion.span>
                    <motion.span animate={{ height: ["100%", "50%", "100%"] }} transition={{ repeat: Infinity, duration: 0.9 }} className="w-0.5 bg-green-400 rounded-t-sm"></motion.span>
                  </span>
                  Now Playing
                </span>
              </div>
              
              <h4 className="text-white text-xs sm:text-sm font-bold truncate leading-tight">{spotifyData.song}</h4>
              <p className="text-gray-400 text-[10px] sm:text-xs truncate font-mono mt-0.5 italic">{spotifyData.artist}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}