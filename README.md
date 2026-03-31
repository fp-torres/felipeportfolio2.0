<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=Felipe%20Torres&fontSize=60&fontColor=fff&animation=fadeIn&fontAlignY=38&desc=Full%20Stack%20Developer%20%26%20Audiovisual%20Editor&descAlignY=60&descSize=18" width="100%"/>
  <br/>
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=18&duration=2800&pause=1200&color=A855F7&center=true&vCenter=true&multiline=true&repeat=true&width=750&height=80&lines=Building+immersive+digital+experiences.;React+%E2%80%A2+PHP+%E2%80%A2+Tailwind+%E2%80%A2+CI%2FCD+%E2%80%A2+APIs;Full+Stack+%7C+Rio+de+Janeiro+%F0%9F%87%A7%F0%9F%87%B7" alt="Typing SVG" />
</div>

<h1 align="center">felipeportfolio 2.0</h1>

<div align="center">
  <p><em>Portfólios comuns mostram o que você já fez. Este mostra quem você é — e o que você é capaz de construir.</em></p>
</div>

---

> Um portfólio evoluído de site estático para aplicação full-stack híbrida com infraestrutura de API própria, totalmente bilíngue (🇧🇷 PT / 🇺🇸 EN), pensado para máxima resiliência, performance e independência de serviços de terceiros.

**Cada feature aqui existe por um motivo técnico real — nada de fluff.**

<div align="center">
  <img src="https://felipeportfolio.forgedevapps.com/preview.gif" width="100%" alt="Portfolio Preview" style="border-radius: 16px; box-shadow: 0 0 40px rgba(168,85,247,0.4)"/>
</div>

---

## 📋 Índice

- [⚡ Features em Destaque](#-features-em-destaque)
- [🕹️ Arcade Zone](#️-arcade-zone)
- [🧱 Arquitetura](#-arquitetura)
- [⚙️ Pipeline CI/CD](#️-pipeline-cicd)
- [🚀 Rodando Localmente](#-rodando-localmente)
- [📂 Estrutura do Projeto](#-estrutura-do-projeto)
- [🛠️ Tech Stack](#️-tech-stack)
- [📫 Contato](#-contato)

---

## ⚡ Features em Destaque

### 🎧 Spotify Widget — Sistema Híbrido

Widget de música em tempo real com API bridge self-hosted.

- 🔐 PHP proxy seguro com OAuth2  
- 🔄 Fallback automático via Discord Lanyard  
- 🟢 Uptime 24/7 independente  
- 🎵 Detecção de faixa em tempo real  

---

### 📱 Mobile-First Architecture

- 👆 Interações otimizadas para touch  
- 🎬 Animações com Framer Motion  
- ⚡ Renderização condicional  
- 🌐 i18n nativo (PT-BR / EN)  

---

### 🛰️ NASA Easter Egg (APOD)

- 🔭 Astronomy Picture of the Day  
- 🌌 Modal animado  
- 💫 Loading + tratamento de erros  
- 🥚 Feature escondida  

---

### 📊 WakaTime Analytics

- ⏱️ Tempo real de desenvolvimento  
- 🧑‍💻 Linguagens utilizadas  
- 📈 Dados reais (sem fake stats)  

---

## 🕹️ Arcade Zone

| Jogo | Descrição | Plataformas |
|------|----------|------------|
| 🃏 Tech Memory | Jogo da memória com tech stack | 🖥️ 📱 |
| 🐍 Dev Snake | Snake com D-Pad mobile | 🖥️ 📱 |
| 🎵 Cyber Sequence | Memória auditiva | 🖥️ 📱 |
| 🧠 Logic Quiz | Desafios de lógica | 🖥️ 📱 |

🏆 High scores salvos localmente

---

## 🧱 Arquitetura

```text
Frontend: React + Vite + Tailwind + Framer Motion  
Backend: PHP (OAuth2 Bridge + Token Manager)  

APIs:
- Spotify
- NASA APOD
- WakaTime
- Discord Lanyard (fallback)

Infra:
- VPS Linux (Hostinger)
- CI/CD com GitHub Actions
⚙️ Pipeline CI/CD

Deploy automático a cada push na main.

name: 🚀 Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - run: npm ci

      - run: npm run build

      - uses: SamKirkland/FTP-Deploy-Action@v4
        with:
          server: ${{ secrets.FTP_SERVER }}
          username: ${{ secrets.FTP_USERNAME }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./dist/

🔒 Credenciais ficam fora do repositório (.gitignore)

🚀 Rodando Localmente
Pré-requisitos
Node.js >= 18
PHP >= 8
1. Clone
git clone https://github.com/fp-torres/felipeportfolio2.0.git
cd felipeportfolio2.0
npm install
2. Configurar Spotify

Crie:

// public/config.php
define('CLIENT_ID', 'SEU_CLIENT_ID');
define('CLIENT_SECRET', 'SEU_CLIENT_SECRET');
define('REFRESH_TOKEN', 'SEU_REFRESH_TOKEN');
3. Backend
php -S localhost:8000 -t public
4. Frontend
npm run dev

👉 http://localhost:5173

📂 Estrutura do Projeto
felipeportfolio2.0/
├── .github/workflows/deploy.yml
├── public/
│   ├── config.php
│   └── spotify.php
├── src/
│   ├── components/
│   │   ├── SpotifyWidget.jsx
│   │   └── sections/
│   │       ├── ArcadeZone.jsx
│   │       ├── Experience.jsx
│   │       └── TechNews.jsx
│   └── context/
│       └── LanguageContext.jsx
├── vite.config.js
├── tailwind.config.js
└── package.json
🛠️ Tech Stack
React + Vite
Tailwind CSS
Framer Motion
PHP
OAuth2
APIs externas
🤝 Contribuindo
git checkout -b feature/sua-feature
git commit -m "feat: descrição"
git push origin feature/sua-feature
📫 Contato
LinkedIn
GitHub
Email