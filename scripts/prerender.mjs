// Runs after `vite build`: renders the Portuguese page into dist/index.html so phones get real content on
// the first paint instead of an empty page while the JavaScript downloads (src/main.jsx then hydrates it).
// Fail-safe on purpose: on any error the client-rendered index.html is kept and the build/deploy continue.
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distIndex = join(root, 'dist', 'index.html');
const ssrOutDir = join(root, 'dist-ssr');
const PLACEHOLDER = '<div id="root"></div>';
const LANG = 'pt';

try {
  await build({
    root,
    logLevel: 'warn',
    build: { ssr: 'src/entry-server.jsx', outDir: ssrOutDir, emptyOutDir: true, copyPublicDir: false },
  });

  const { render } = await import(pathToFileURL(join(ssrOutDir, 'entry-server.js')).href);
  const appHtml = render(LANG);
  const template = readFileSync(distIndex, 'utf8');

  if (!template.includes(PLACEHOLDER)) throw new Error(`${PLACEHOLDER} not found in dist/index.html`);
  if (!appHtml || appHtml.length < 1000) throw new Error('the pre-rendered markup looks empty');

  // A replacement function, not a string: "$'", "$&", "$$"… in the markup must be written as is.
  writeFileSync(
    distIndex,
    template.replace(PLACEHOLDER, () => `<div id="root" data-prerender-lang="${LANG}">${appHtml}</div>`),
  );
  console.log(`[prerender] dist/index.html pre-rendered in "${LANG}" (${Math.round(appHtml.length / 1024)} KB of markup)`);
} catch (error) {
  console.warn('[prerender] skipped — the page will render on the client only:', error?.stack ?? error);
} finally {
  rmSync(ssrOutDir, { recursive: true, force: true });
}
