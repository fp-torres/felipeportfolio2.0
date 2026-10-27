import { LazyMotion, MotionConfig } from 'framer-motion';
import { LanguageProvider } from './context/LanguageProvider';
import { useLanguage } from './context/useLanguage';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import FloatingDock from './components/layout/FloatingDock';

// Seções
import Hero from './components/sections/Hero';
import Experience from './components/sections/Experience';
import Certificates from './components/sections/Certificates';
import Projects from './components/sections/Projects';
import Skills from './components/sections/Skills';
import Activity from './components/sections/Activity';
import GameHub from './components/sections/GameHub';

// Components use `m` (from framer-motion); the animation features arrive in a separate chunk.
const loadMotionFeatures = () => import('./lib/motionFeatures.js').then((module) => module.default);

function SkipLink() {
  const { t } = useLanguage();

  return (
    <a href="#main-content" className="btn-primary fixed left-4 top-2 z-skip -translate-y-24 focus:translate-y-0">
      {t.ui.skipToContent}
    </a>
  );
}

function App({ initialLang }) {
  return (
    <LanguageProvider initialLang={initialLang}>
      <LazyMotion features={loadMotionFeatures}>
        <MotionConfig reducedMotion="user">
          <div className="relative isolate min-h-screen overflow-x-clip bg-bg font-sans text-label-1">
            <SkipLink />
            <ErrorBoundary>
              <Navbar />
            </ErrorBoundary>

            {/* Each section is isolated: one failure never blanks the whole page. */}
            <main id="main-content">
              <ErrorBoundary>
                <Hero />
              </ErrorBoundary>
              <ErrorBoundary>
                <Experience />
              </ErrorBoundary>
              <ErrorBoundary>
                <Certificates />
              </ErrorBoundary>
              <ErrorBoundary>
                <Projects />
              </ErrorBoundary>
              <ErrorBoundary>
                <Skills />
              </ErrorBoundary>
              <ErrorBoundary>
                <Activity />
              </ErrorBoundary>
              <ErrorBoundary>
                <GameHub />
              </ErrorBoundary>
            </main>

            <ErrorBoundary>
              <Footer />
            </ErrorBoundary>
            <ErrorBoundary>
              <FloatingDock />
            </ErrorBoundary>
          </div>
        </MotionConfig>
      </LazyMotion>
    </LanguageProvider>
  );
}

export default App;
