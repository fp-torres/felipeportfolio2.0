import { rmSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { imagetools } from 'vite-imagetools'

// PHP bridges run on PHP's built-in server during development (`npm run dev:api`).
const PHP_DEV_SERVER = 'http://127.0.0.1:8000'

// True for every URL that could reach a config.php: decoded first (/%63onfig.php, /config%2Ephp), then normalised
// (//config.php, /./config.php, /a/../config.php), in any folder (/public/config.php, /@fs/…/public/config.php).
function isConfigRequest(url = '') {
  let path = url.split(/[?#]/, 1)[0]
  for (let i = 0; i < 3 && path.includes('%'); i += 1) {
    try {
      path = decodeURIComponent(path)
    } catch {
      break
    }
  }
  path = posix.normalize(path.replace(/\\/g, '/')).replace(/\/+$/, '')
  return /(?:^|\/)config\.php$/i.test(path)
}

// public/config.php holds real tokens for local development only: Vite must never serve it as a static file,
// and it must never end up in dist/ (the deploy workflow writes the production config.php after the build).
function protectSecrets() {
  const blockConfig = (req, res, next) => {
    if (isConfigRequest(req.url)) {
      res.statusCode = 404
      res.end()
      return
    }
    next()
  }
  let outDir = 'dist'

  return {
    name: 'protect-secrets',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      server.middlewares.use(blockConfig)
    },
    configurePreviewServer(server) {
      server.middlewares.use(blockConfig)
    },
    closeBundle() {
      rmSync(resolve(outDir, 'config.php'), { force: true })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // imagetools: responsive variants at build time, e.g. import srcSet from './a.png?w=480;800;1200&format=webp&as=srcset'
  plugins: [react(), imagetools(), protectSecrets()],
  server: {
    proxy: {
      // Every bridge (github.php, wakatime.php, spotify.php, nasa.php…) — never config.php.
      '^/(?!config\\.php)[\\w-]+\\.php': PHP_DEV_SERVER,
    },
    // Defence in depth for /@fs/ and files under the project root: Vite's default list plus every config.php.
    fs: {
      deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/config.php'],
    },
  },
  build: {
    target: 'es2020',
  },
})
