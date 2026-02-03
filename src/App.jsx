import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/layout/Navbar';
import Background from './components/layout/Background';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';

// Seções
import Hero from './components/sections/Hero'; 
import Experience from './components/sections/Experience';
import Projects from './components/sections/Projects';
import Skills from './components/sections/Skills';
import Certificates from './components/sections/Certificates';

// AQUI ESTAVA O ERRO: Trocamos o jogo direto pelo HUB (Catálogo)
import GameHub from './components/sections/GameHub'; 

function App() {
  return (
    <LanguageProvider>
      <div className="relative min-h-screen text-text overflow-x-hidden font-sans">
        <Background />
        
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
            <Hero />
            
            <Experience />
            <Certificates />
            <Projects />
            <Skills />

            {/* Renderiza o Hub de Jogos em vez do jogo direto */}
            <GameHub />
        </main>
        
        <Footer />
        <ScrollToTop />
      </div>
    </LanguageProvider>
  );
}

export default App;