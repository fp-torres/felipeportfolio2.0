import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/useLanguage';
import { Icon } from '@iconify/react';
import { AnimatePresence, motion as Motion } from 'framer-motion';

export default function Certificates() {
  const { t } = useLanguage();
  const [selectedCert, setSelectedCert] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const visibleCertificates = showAll ? t.certificates.items : t.certificates.items.slice(0, 4);

  useEffect(() => {
    if (!selectedCert) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedCert(null);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedCert]);

  return (
    <section id="certificates" className="py-20">
      <div className="flex items-center gap-3 justify-center mb-12">
        <Icon icon="solar:diploma-verified-bold" className="text-primary text-3xl md:text-4xl" />
        <h2 className="text-3xl md:text-4xl font-bold">{t.certificates.title}</h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {visibleCertificates.map((cert) => (
          <Motion.button 
            key={cert.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="w-full text-left cursor-pointer bg-surface rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all shadow-lg group relative"
            type="button"
            onClick={() => setSelectedCert(cert)}
          >
            {/* Imagem Preview */}
            <div className="h-40 overflow-hidden relative">
                <img src={cert.image} alt={cert.name} loading="lazy" decoding="async" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon icon="solar:eye-bold" className="text-white text-3xl" />
                </div>
            </div>

            {/* Texto */}
            <div className="p-4">
                <h3 className="font-bold text-white text-md leading-tight mb-1 truncate">{cert.name}</h3>
                <p className="text-xs text-primary">{cert.issuer}</p>
            </div>
          </Motion.button>
        ))}
      </div>

     {/* Botão Ver Mais / Ver Menos TRADUZIDO */}
      {t.certificates.items.length > 4 && (
        <div className="flex justify-center mt-10">
            <button 
                onClick={() => setShowAll(!showAll)}
                className="flex items-center gap-2 px-6 py-2 border border-primary text-primary rounded-full hover:bg-primary hover:text-bg transition-colors font-bold"
            >
                {/* USANDO AS VARIÁVEIS DE TRADUÇÃO AQUI */}
                {showAll ? t.certificates.seeLess : t.certificates.seeMore}
                <Icon icon={showAll ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-down-bold"} />
            </button>
        </div>
      )}

      {/* Modal Lightbox */}
      <AnimatePresence>
        {selectedCert && (
          <Motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedCert(null)}
            role="dialog"
            aria-modal="true"
            aria-label={selectedCert.name}
          >
            <Motion.div 
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="relative max-w-4xl w-full max-h-[90vh] bg-surface rounded-xl overflow-hidden border border-white/10 flex flex-col"
                onClick={(e) => e.stopPropagation()} 
            >
                <button 
                    type="button"
                    onClick={() => setSelectedCert(null)} 
                    className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-primary hover:text-bg transition-colors z-10"
                    aria-label={t.nav.home === 'Início' ? 'Fechar certificado' : 'Close certificate'}
                >
                    <Icon icon="solar:close-circle-bold" width="30" />
                </button>
                <div className="flex-1 overflow-auto bg-black flex items-center justify-center">
                    <img src={selectedCert.image} alt={selectedCert.name} decoding="async" className="max-w-full max-h-[80vh] object-contain" />
                </div>
                <div className="p-4 bg-surface border-t border-white/10 text-center shrink-0">
                    <h3 className="text-xl font-bold text-white">{selectedCert.name}</h3>
                    <p className="text-muted">{selectedCert.issuer}</p>
                </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
