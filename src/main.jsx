import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
// Inter Variable (with optical sizes) is only downloaded where SF Pro isn't the system font.
import '@fontsource-variable/inter/opsz.css'
// Icons of the code every visitor loads, bundled at build time (scripts/build-icons.mjs); the lazy chunks get
// theirs through lazyWithRetry — no runtime requests to the Iconify API.
import './lib/icons.generated.js'
import './index.css'
import App from './App.jsx'
import { detectLanguage } from './context/detectLanguage'

const container = document.getElementById('root')
const initialLang = detectLanguage()
const app = (
  <StrictMode>
    <App initialLang={initialLang} />
  </StrictMode>
)

// The build pre-renders the Portuguese page into #root (scripts/prerender.mjs). Hydrate it when the visitor
// gets that language; otherwise (English, or dev without pre-rendering) render from scratch.
if (container.hasChildNodes() && container.dataset.prerenderLang === initialLang) {
  hydrateRoot(container, app)
} else {
  createRoot(container).render(app)
}
