import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/layout/Navbar';
import Background from './components/layout/Background';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop'; // Importando a setinha

// Seções
import Hero from './components/sections/Hero';
import Experience from './components/sections/Experience';
import Projects from './components/sections/Projects';
import Skills from './components/sections/Skills';
import Certificates from './components/sections/Certificates';

function App() {
  return (
    <LanguageProvider>
      <div className="relative min-h-screen text-text overflow-x-hidden font-sans">
        <Background />
        
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <Hero />
            <Experience />
            <Certificates />
            <Projects />
            <Skills />
        </main>
        
        <Footer />
        <ScrollToTop /> {/* Componente da setinha no canto */}
      </div>
    </LanguageProvider>
  );
}

export default App;