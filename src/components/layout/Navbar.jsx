import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { lang, toggleLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMobileScroll = (e, targetId) => {
    e.preventDefault(); 
    setIsOpen(false);   
    
    setTimeout(() => {
      const id = targetId.replace('#', ''); 
      const element = document.getElementById(id);
      
      if (element) {
        const navbarHeight = 80; 
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        
        window.scrollTo({
          top: elementPosition - navbarHeight,
          behavior: 'smooth'
        });
      }
    }, 100); 
  };

  const navLinks = [
    { name: t.nav.home, href: "#hero" },
    { name: t.nav.experience, href: "#experience" },
    { name: t.nav.certificates, href: "#certificates" },
    { name: t.nav.projects, href: "#projects" },
    { name: t.nav.skills, href: "#skills" },
    { name: t.nav.minigames, href: "#minigames" },
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
        <a href="#hero" onClick={(e) => handleMobileScroll(e, 'hero')} className="text-2xl font-bold border-2 border-primary px-2 py-1 text-primary tracking-widest hover:bg-primary hover:text-bg transition-colors cursor-pointer">
          FT
        </a>

        {/* DESKTOP MENU */}
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
          
          {/* INVERSÃO DA BANDEIRA APLICADA AQUI */}
          <button onClick={toggleLanguage} className="text-2xl hover:scale-110 transition-transform" title={lang === 'pt' ? "Mudar para Inglês" : "Change to Portuguese"}>
             {lang === 'pt' ? '🇺🇸' : '🇧🇷'}
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
           {/* INVERSÃO DA BANDEIRA APLICADA AQUI TAMBÉM */}
           <button onClick={toggleLanguage} className="text-2xl" title={lang === 'pt' ? "Mudar para Inglês" : "Change to Portuguese"}>
             {lang === 'pt' ? '🇺🇸' : '🇧🇷'}
           </button>

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
              
              {navLinks.map((item) => (
                <a 
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleMobileScroll(e, item.href)} 
                  className="w-full text-center py-4 rounded-xl text-gray-300 font-medium text-lg border border-transparent hover:bg-white/5 hover:border-white/10 hover:text-primary transition-all duration-300 active:scale-95 active:text-primary cursor-pointer"
                >
                  {item.name}
                </a>
              ))}

              <a 
                href="#contact" 
                onClick={(e) => handleMobileScroll(e, '#contact')} 
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