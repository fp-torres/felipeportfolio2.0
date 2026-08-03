# 🚀 Felipe Torres — Interactive Full Stack Portfolio

Um portfólio **bilíngue, responsivo e altamente interativo**, desenvolvido com **React, Vite e Tailwind CSS**, que apresenta minha trajetória profissional, projetos, certificações, stack de tecnologias e métricas reais de desenvolvimento.

Além de funcionar como vitrine profissional, o projeto inclui diversas integrações em tempo real, easter eggs e uma arcade com minigames desenvolvidos para demonstrar criatividade, performance e qualidade de código.

---

## ✨ Destaques

* 🌎 Interface completa em **Português** e **English**, com idioma salvo automaticamente.
* 👨‍💻 Perfil e atividade pública carregados diretamente pela **API do GitHub**.
* 📊 Estatísticas do **WakaTime** com visualização de:

  * Últimos **7 dias**
  * Últimos **30 dias**
  * Histórico completo
* 💾 Sistema inteligente de **cache em duas camadas**, preservando a última leitura válida mesmo durante indisponibilidades da API.
* 🎵 Integração com **Spotify**, utilizando uma bridge em PHP com fallback automático via Discord/Lanyard.
* 🚀 Easter Eggs exclusivos:

  * NASA Astronomy Picture of the Day (APOD)
  * Máquina do Tempo
  * Radar de Notícias
* 🎮 Arcade com **6 minigames totalmente responsivos**, incluindo sistema de recordes locais.
* ⚡ Carregamento sob demanda (*lazy loading*) para jogos e otimização de imagens em **WebP**.
* ♿ Interface acessível com:

  * Navegação por teclado
  * Indicadores de foco
  * Suporte a *Reduced Motion*
  * Menus e modais acessíveis
* 🔄 Deploy automatizado para Hostinger utilizando **GitHub Actions**.

---

# 🛠️ Tecnologias

### Front-end

* React 19
* Vite 7
* Tailwind CSS
* Framer Motion

### Back-end

* PHP
* cURL

### DevOps

* GitHub Actions
* FTP Deploy
* Hostinger

---

# 📈 Integração com WakaTime

O portfólio exibe por padrão as estatísticas dos **últimos 30 dias**, representando melhor a atividade recente do que o histórico completo.

Os períodos disponíveis são:

* `last_7_days`
* `last_30_days`
* `all_time`

### Cache Inteligente

A integração foi desenvolvida para evitar dados inconsistentes:

* Cache de **15 minutos** no servidor (PHP).
* Cache local no navegador.
* Preservação automática da última leitura válida.
* Nenhum valor fictício é exibido.
* Quando a API estiver indisponível, em processamento ou limitada por rate limit, o usuário continua visualizando os últimos dados reais.

---

# 🚀 Executando Localmente

## Pré-requisitos

* Node.js **22+**
* npm
* PHP **7.4+**
* Extensão **cURL** habilitada

### 1. Instale as dependências

```bash
npm ci
```

### 2. Crie a configuração local

```bash
cp public/config.example.php public/config.php
```

Configure o arquivo ou exporte as seguintes variáveis:

```text
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
SPOTIFY_REFRESH_TOKEN
WAKATIME_TOKEN
```

### 3. Inicie a API PHP

```bash
npm run dev:api
```

### 4. Execute o Vite

```bash
npm run dev
```

O Vite encaminha automaticamente as requisições para:

* `/spotify.php`
* `/wakatime.php`

via

```
127.0.0.1:8000
```

---

# ✅ Validação

Executar verificações da aplicação:

```bash
npm run lint
npm run build
npm run preview
```

Validar os bridges PHP:

```bash
php -l public/wakatime.php
php -l public/spotify.php
```

---

# 🚀 Deploy

Cada push realizado na branch **main** executa automaticamente o pipeline de CI/CD:

1. Instalação das dependências (`npm ci`)
2. Execução do ESLint
3. Build de produção
4. Geração segura de `dist/config.php`
5. Publicação automática para a Hostinger via FTP

### Secrets necessários

```text
FTP_SERVER
FTP_USERNAME
FTP_PASSWORD

SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
SPOTIFY_REFRESH_TOKEN

WAKATIME_TOKEN
```

> **Importante:**
> `public/config.php` permanece no `.gitignore` e nunca deve ser enviado ao repositório. Caso qualquer credencial seja exposta, revogue-a imediatamente e gere uma nova.

---

# 📁 Estrutura do Projeto

```text
public/
├── config.example.php
├── spotify.php
└── wakatime.php

src/
├── components/
│   ├── games/
│   ├── layout/
│   └── sections/
├── context/
└── data/
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

Todos os recordes são armazenados exclusivamente no **localStorage** do navegador do visitante.

---

# 🎯 Objetivo

Mais do que um simples portfólio, este projeto foi desenvolvido para demonstrar conhecimentos em desenvolvimento **Full Stack**, experiência do usuário, acessibilidade, performance, integrações com APIs, automação de deploy e boas práticas modernas de desenvolvimento web.
