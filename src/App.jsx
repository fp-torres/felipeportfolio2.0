import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/layout/Navbar';
import Background from './components/layout/Background';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
import SpotifyWidget from './components/SpotifyWidget';

// Seções
import Hero from './components/sections/Hero'; 
import Experience from './components/sections/Experience';
import Projects from './components/sections/Projects';
import Skills from './components/sections/Skills';
import Certificates from './components/sections/Certificates';
import GameHub from './components/sections/GameHub'; 

function App() {
  return (
    <LanguageProvider>
      <div className="relative isolate min-h-screen text-text overflow-x-hidden font-sans bg-bg">
        <a
          href="#main-content"
          className="fixed left-4 top-3 z-[200] -translate-y-20 rounded-lg bg-primary px-4 py-2 font-bold text-bg transition-transform focus:translate-y-0"
        >
          Pular para o conteúdo
        </a>

        <Background />
        <Navbar />
        
        <main
          id="main-content"
          className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-10 sm:space-y-14 lg:space-y-20"
        >
          <Hero />
          <Experience />
          <Certificates />
          <Projects />
          <Skills />
          <GameHub />
        </main>
        
        <Footer />
        <ScrollToTop />
        <SpotifyWidget />
      </div>
    </LanguageProvider>
  );
}

export default App;
