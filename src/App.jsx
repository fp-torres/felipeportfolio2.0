import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/layout/Navbar';
import Background from './components/layout/Background';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';

// Seções
import Hero from './components/sections/Hero'; // O Hero agora contém a bio e o grid
import Experience from './components/sections/Experience';
import Projects from './components/sections/Projects';
import Skills from './components/sections/Skills';
import Certificates from './components/sections/Certificates';
import TechMemoryGame from './components/sections/TechMemoryGame';

function App() {
  return (
    <LanguageProvider>
      <div className="relative min-h-screen text-text overflow-x-hidden font-sans">
        <Background />
        
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
            {/* O Hero novo já inclui a apresentação e o Bento Grid (Sobre) */}
            <Hero />
            
            <Experience />
            <Certificates />
            <Projects />
            <Skills />

            <TechMemoryGame />
        </main>
        
        <Footer />
        <ScrollToTop />
      </div>
    </LanguageProvider>
  );
}

export default App;