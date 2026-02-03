import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { language, toggleLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- FUNÇÃO CORINGA PARA ROLAGEM SUAVE ---
  // Essa função agora cuida de TODOS os cliques no mobile
  const handleMobileScroll = (e, targetId) => {
    e.preventDefault(); // Impede o comportamento padrão que estava falhando
    setIsOpen(false);   // Fecha o menu
    
    setTimeout(() => {
      const id = targetId.replace('#', ''); // Remove o # se houver
      const element = document.getElementById(id);
      
      if (element) {
        const navbarHeight = 80; // Compensação da barra fixa
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        
        window.scrollTo({
          top: elementPosition - navbarHeight,
          behavior: 'smooth'
        });
      }
    }, 100); // Pequeno delay para o menu fechar visualmente antes de rolar
  };

  const navLinks = [
    { name: t.nav.home, href: "#hero" },
    { name: t.nav.experience, href: "#experience" },
    { name: t.nav.certificates, href: "#certificates" },
    { name: t.nav.projects, href: "#projects" },
    { name: t.nav.skills, href: "#skills" },
    { name: t.nav.minigame, href: "#minigame" },
  ];

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled || isOpen 
          ? 'bg-[#0F172A]/95 backdrop-blur-md border-white/10 py-4' 
          : 'bg-transparent border-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center relative">
        
        {/* LOGO */}
        <a href="#" onClick={(e) => handleMobileScroll(e, 'hero')} className="text-2xl font-bold border-2 border-primary px-2 py-1 text-primary tracking-widest hover:bg-primary hover:text-bg transition-colors cursor-pointer">
          FT
        </a>

        {/* DESKTOP MENU (Mantivemos o padrão href aqui pois no desktop funciona bem) */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <a 
              key={item.name} 
              href={item.href} 
              className="text-sm font-medium text-gray-300 hover:text-primary transition-colors uppercase tracking-wide"
            >
              {item.name}
            </a>
          ))}
          
          <button onClick={toggleLanguage} className="text-2xl hover:scale-110 transition-transform" title="Mudar idioma">
             {language === 'pt' ? '🇧🇷' : '🇺🇸'}
          </button>

          <a 
            href="#contact" 
            className="bg-primary text-bg px-6 py-2 rounded-full font-bold hover:bg-white transition-colors cursor-pointer"
          >
            {t.nav.contact}
          </a>
        </div>

        {/* MOBILE CONTROLS */}
        <div className="md:hidden flex items-center gap-4">
           <button onClick={toggleLanguage} className="text-2xl" title="Mudar idioma">
             {language === 'pt' ? '🇧🇷' : '🇺🇸'}
           </button>

           {/* Botão Hamburguer */}
           <button 
             onClick={() => setIsOpen(!isOpen)} 
             className="text-3xl focus:outline-none transition-transform active:scale-90 p-1 text-primary" 
             aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
           >
             <Icon 
               icon={isOpen ? "solar:close-square-bold" : "solar:hamburger-menu-bold"} 
             />
           </button>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-[#0F172A] border-t border-b border-white/10 overflow-hidden shadow-2xl absolute w-full left-0 top-full"
          >
            <div className="flex flex-col items-center gap-2 p-6">
              
              {/* LOOP DOS LINKS PRINCIPAIS */}
              {navLinks.map((item) => (
                <a 
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleMobileScroll(e, item.href)} // AQUI ESTÁ A CORREÇÃO MÁGICA
                  className="w-full text-center py-4 rounded-xl text-gray-300 font-medium text-lg border border-transparent hover:bg-white/5 hover:border-white/10 hover:text-primary transition-all duration-300 active:scale-95 active:text-primary cursor-pointer"
                >
                  {item.name}
                </a>
              ))}

              {/* Botão de Contato Mobile */}
              <a 
                href="#contact" 
                onClick={(e) => handleMobileScroll(e, '#contact')} // Usando a mesma função mágica
                className="w-full text-center mt-4 bg-primary text-bg py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transition-colors shadow-lg active:scale-95 cursor-pointer"
              >
                {t.nav.contact}
              </a>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}