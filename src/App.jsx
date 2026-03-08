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
      <div className="relative min-h-screen text-text overflow-x-hidden font-sans bg-bg">
        <Background />
        
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
            <Hero />
            
            <Experience />
            <Certificates />

        
            <Projects />
            <Skills />

            {/* Hub de Jogos para fechar com interatividade */}
            <GameHub />
        </main>
        
        <Footer />
        <ScrollToTop />
        
        {/* Widget Flutuante que reage ao seu Spotify via ID: 402555995462565891 */}
        <SpotifyWidget />
      </div>
    </LanguageProvider>
  );
}

export default App;