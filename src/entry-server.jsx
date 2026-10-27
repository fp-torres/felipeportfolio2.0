import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import './lib/icons.generated.js';
import App from './App.jsx';

// Pre-render entry used by scripts/prerender.mjs: the markup phones show before any JavaScript runs.
export function render(lang = 'pt') {
  return renderToString(
    <StrictMode>
      <App initialLang={lang} />
    </StrictMode>,
  );
}
