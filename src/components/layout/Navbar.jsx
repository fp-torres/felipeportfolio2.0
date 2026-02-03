import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useLanguage } from '../../context/LanguageContext';

export default function Navbar() {
  const { t, toggleLanguage, lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { name: t.nav.experience, href: '#experience' },
    { name: t.nav.certificates, href: '#certificates' },
    { name: t.nav.projects, href: '#projects' },
    { name: t.nav.skills, href: '#skills' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-bg/90 backdrop-blur-md shadow-lg border-b border-white/5' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo FT clicável que leva ao topo */}
          <button onClick={scrollToTop} className="flex-shrink-0 font-bold text-2xl tracking-wider cursor-pointer hover:scale-105 transition-transform">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white font-extrabold border-2 border-primary/50 px-2 py-1 rounded">FT</span>
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-baseline space-x-6">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} className="text-sm font-medium text-gray-300 hover:text-primary transition-colors">
                  {link.name}
                </a>
              ))}
            </div>
            
            <button onClick={toggleLanguage} className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10" title="Mudar idioma">
              <span className="text-lg">{lang === 'pt' ? '🇺🇸' : '🇧🇷'}</span>
            </button>
            
             <a href="#contact" className="px-5 py-2 bg-primary text-bg font-bold rounded-full text-sm hover:bg-primary-600 transition-colors">
                {t.nav.contact}
             </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={toggleLanguage} className="text-2xl">
               {lang === 'pt' ? '🇺🇸' : '🇧🇷'}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-white hover:text-primary p-2">
              <Icon icon={isOpen ? "solar:close-square-bold" : "solar:hamburger-menu-bold"} width="32" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-surface border-b border-white/10 absolute w-full left-0">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-primary hover:bg-white/5">
                {link.name}
              </a>
            ))}
             <a href="#contact" onClick={() => setIsOpen(false)} className="block px-3 py-3 mt-4 text-center rounded-md font-bold bg-primary text-bg">
                {t.nav.contact}
             </a>
          </div>
        </div>
      )}
    </nav>
  );
}