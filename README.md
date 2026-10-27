# 🚀 Felipe Torres — Interactive Full Stack Portfolio

Um portfólio **bilíngue, 100% responsivo e altamente interativo**, desenvolvido com **React, Vite e Tailwind CSS**, que apresenta minha trajetória profissional, projetos, certificações, stack de tecnologias e métricas reais de desenvolvimento.

O visual segue a linguagem de design da Apple — tipografia grande, muito respiro, uma única cor de destaque e movimento sutil — e foi pensado **primeiro para o celular**: de 320 px (iPhone SE) a telas 4K, em pé ou deitado, com toque ou mouse.

Além de funcionar como vitrine profissional, o projeto inclui integrações em tempo real, easter eggs e uma arcade com minigames desenvolvidos para demonstrar criatividade, performance e qualidade de código.

---

## ✨ Destaques

* 📱 **Mobile-first de verdade**: nenhum alvo de toque menor que 44 pt, nenhum texto menor que 12 px e nenhuma rolagem lateral de 280 a 2560 px.
* 🍎 **Design system no estilo Apple**: tokens de cor, tipografia fluida (`clamp()`), espaçamentos, raios e movimento centralizados em `tailwind.config.js` e `src/index.css`. Usa a fonte SF Pro nos aparelhos Apple e a Inter Variable (self-hosted) nos demais.
* ⚡ **Performance**: a página é **pré-renderizada no build**, então o conteúdo aparece antes do JavaScript. As imagens são WebP responsivas (`srcset`) geradas no build, os ícones vêm embutidos (sem requisições ao Iconify) e as seções/modais pesados são carregados sob demanda.
* 🌎 Interface completa em **Português** e **English**, com idioma salvo automaticamente.
* 👨‍💻 Contribuições, repositórios e seguidores do **GitHub** servidos pelo bridge PHP (com token e cache no servidor).
* 📊 Estatísticas do **WakaTime** nos últimos **7 dias**, **30 dias** ou **histórico completo**.
* 💾 **Cache em duas camadas** (servidor + navegador) com *stale-while-revalidate*: a última leitura válida continua visível mesmo durante indisponibilidades das APIs. Nenhum valor fictício é exibido.
* 🎵 Integração com **Spotify** via bridge PHP, com fallback automático via Discord/Lanyard.
* 🚀 Easter eggs no **Laboratório**: NASA Astronomy Picture of the Day, Máquina do Tempo e Radar de Notícias.
* 🎮 Arcade com **6 minigames** em tela cheia no celular, com controles de toque, teclado e recordes locais.
* ♿ Acessível: navegação por teclado, foco visível, modais com foco preso e devolvido, suporte a *Reduzir movimento* e rótulos em PT/EN.
* 🔄 Deploy automatizado para a Hostinger com **GitHub Actions**.

---

# 🛠️ Tecnologias

### Front-end

* React 19 (pré-renderização no build + hidratação)
* Vite 7 (+ `vite-imagetools` para imagens responsivas)
* Tailwind CSS 3
* Framer Motion (carregado sob demanda com `LazyMotion`)
* Iconify (ícones embutidos no build)

### Back-end

* PHP 8.2
* cURL

### DevOps

* GitHub Actions
* FTP Deploy
* Hostinger

---

# 📈 Integração com WakaTime

O portfólio exibe por padrão as estatísticas dos **últimos 30 dias**, representando melhor a atividade recente do que o histórico completo.

Os períodos disponíveis são `last_7_days`, `last_30_days` e `all_time`.

### Cache inteligente

* Cache no servidor com *stale-while-revalidate* (15 minutos para o WakaTime, 1 hora para o GitHub), gravado fora da pasta pública.
* Cache local no navegador e uma única requisição por recurso, mesmo que vários componentes usem o mesmo dado.
* Quando a API estiver indisponível, em processamento ou limitada, o visitante continua vendo os últimos dados reais, com o horário da leitura.

---

# 🚀 Executando localmente

## Pré-requisitos

* Node.js **22** (o arquivo `.nvmrc` já define a versão: `nvm use`)
* npm
* PHP **8.2+** com a extensão **cURL**

### 1. Instale as dependências

```bash
nvm use
npm ci
```

### 2. Crie a configuração local

```bash
cp public/config.example.php public/config.php
```

Preencha o arquivo (ou exporte as variáveis de ambiente):

```text
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
SPOTIFY_REFRESH_TOKEN
WAKATIME_TOKEN
GITHUB_TOKEN    # token de leitura pública (calendário de contribuições)
NASA_API_KEY    # opcional — grátis em https://api.nasa.gov (sem ela usa a DEMO_KEY)
```

### 3. Inicie a API PHP

```bash
npm run dev:api
```

### 4. Execute o Vite

```bash
npm run dev
```

O Vite encaminha todos os bridges (`/github.php`, `/wakatime.php`, `/spotify.php`, `/nasa.php`) para o PHP em `127.0.0.1:8000`. O `config.php` nunca é servido pelo Vite nem copiado para o `dist/`.

---

# ✅ Validação

```bash
npm run lint
npm run build     # ícones + build do Vite + pré-renderização
npm run preview
```

Validar os bridges PHP:

```bash
for f in public/*.php; do php -l "$f"; done
```

---

# 🚀 Deploy

Cada push na branch **main** executa automaticamente o pipeline de CI/CD:

1. Instalação das dependências (`npm ci`)
2. ESLint
3. Build de produção (ícones embutidos, imagens responsivas e pré-renderização da página)
4. Geração segura de `dist/config.php`
5. Publicação automática para a Hostinger via FTP

### Secrets do GitHub Actions

```text
FTP_SERVER
FTP_USERNAME
FTP_PASSWORD

SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
SPOTIFY_REFRESH_TOKEN

WAKATIME_TOKEN

GH_CONTRIB_TOKEN   # opcional — vira $GITHUB_TOKEN (o GitHub não aceita secrets começando com GITHUB_)
NASA_API_KEY       # opcional
```

> **Importante — ordem dos secrets:** o `config.php` só é reenviado pelo FTP quando o conteúdo gerado muda. Hoje o `$GITHUB_TOKEN` existe apenas no `config.php` editado à mão no servidor; por isso **crie o `GH_CONTRIB_TOKEN` antes (ou junto) de qualquer mudança de secret** — inclusive ao trocar as credenciais do Spotify ou adicionar a `NASA_API_KEY` — senão o card do GitHub perde o token.

> **Segurança:** `public/config.php` permanece no `.gitignore` e nunca deve ser enviado ao repositório. Caso qualquer credencial seja exposta, revogue-a imediatamente e gere uma nova.

### Cabeçalhos e cache (`public/.htaccess`)

* HSTS, `Permissions-Policy` e uma CSP em modo *Report-Only* (depois de 1–2 semanas sem violações no console, troque para `Content-Security-Policy`).
* `index.html` sem cache; arquivos com hash em `/assets/` com cache imutável de 1 ano.
* Acesso negado a arquivos ocultos (como `/.ftp-deploy-sync-state.json`), a `_*.php` e a `config*.php`.

---

# 📁 Estrutura do projeto

```text
public/
├── _bridge.php           # helper comum dos bridges (cache, timeouts, erros)
├── github.php
├── wakatime.php
├── spotify.php
├── nasa.php
├── config.example.php
└── .htaccess

scripts/
├── build-icons.mjs       # embute no build os ícones Iconify usados em src/
└── prerender.mjs         # pré-renderiza a página após o vite build

src/
├── components/
│   ├── ui/               # Sheet, Section, SectionHeader, Segmented, ErrorBoundary, ScreenFrame
│   ├── layout/           # Navbar, Footer, FloatingDock, ScrollToTop
│   ├── sections/         # Hero, Experience, Certificates, Projects, Skills, Activity, GameHub
│   ├── activity/ · certificates/ · lab/ · games/
├── context/              # idioma (PT/EN)
├── data/                 # textos pt.js / en.js e imagens (images.js)
├── hooks/
└── lib/                  # http, cache de recursos, motion, lazyWithRetry
```

---

# 🎮 Arcade

O portfólio conta com uma pequena arcade desenvolvida em React, composta por seis jogos:

* 🧠 Tech Memory
* 🐍 Dev Snake
* 🔢 Cyber Sequence
* 💻 Matrix Recall
* 🔐 Decryptor
* ❓ Logic Quiz

Os jogos abrem em tela cheia no celular, funcionam com toque e teclado, e os recordes ficam no **localStorage** do navegador do visitante.

---

# 🎯 Objetivo

Mais do que um simples portfólio, este projeto foi desenvolvido para demonstrar conhecimentos em desenvolvimento **Full Stack**, design de interfaces, experiência do usuário, acessibilidade, performance, integrações com APIs, automação de deploy e boas práticas modernas de desenvolvimento web.
