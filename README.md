# 🚀 Felipe Torres | Interactive Full Stack Portfolio v3.0

Um portfólio pessoal de **alto desempenho**, **altamente interativo** e **bilíngue (PT/EN)**.
Esta versão marca a transição de um **site estático** para uma **aplicação híbrida com infraestrutura de API própria**.

🔗 **Visualizar Projeto Online**
*(adicione aqui o link do deploy quando quiser)*

---

# ✨ O que há de novo (v3.0)

A versão **3.0** foca em **autonomia e resiliência**, reduzindo a dependência de plataformas externas para status em tempo real.

---

# 🎧 Spotify Direct API (Hybrid Mode)

Diferente da versão anterior, o widget agora utiliza uma **infraestrutura própria de integração**.

* **PHP Bridge**
  Um servidor de backend leve atua como ponte (**Proxy**) para a API oficial do Spotify via OAuth2.

* **Independência**
  O widget funciona **24/7**, mesmo se o Discord estiver fechado.

* **Fallback Inteligente**
  Caso a API direta não retorne dados, o sistema alterna automaticamente para a **Lanyard API (Discord)**, garantindo **100% de uptime** no status.

---

# 📊 WakaTime Analytics

Dashboard dinâmico que consome a **API do WakaTime** para exibir métricas reais de codificação, permitindo que visitantes vejam o esforço técnico por trás do projeto.

---

# 🛰️ NASA Easter Egg (APOD)

Acesso interceptado via **sinal de rádio no Footer**.

Utiliza a **NASA APOD API** para renderizar a **Astronomy Picture of the Day** em um **modal holográfico**, incluindo:

* tratamento de erros
* estados de carregamento
* renderização dinâmica

---

# 📱 Refatoração Mobile-First

Todo o ecossistema foi refatorado para garantir **100% de responsividade**.

A experiência mobile agora conta com:

* gestos otimizados
* melhor performance nas animações
* otimização do **Framer Motion**

---

# 🕹️ Arcade Zone

Área de entretenimento desenvolvida **100% em React**, com persistência de dados local.

### 🎮 Mini Games

* **Tech Memory**
  Jogo de memória com ícones de tecnologia

* **Dev Snake**
  Clássico Snake com controles otimizados para mobile

* **Cyber Sequence**
  Teste de memória rítmica usando **Web Audio API**

* **Logic Quiz**
  Desafios de lógica de programação

---

# 🛠️ Tecnologias & APIs

## Core Stack

* **Frontend:** React.js + Vite
* **Styling:** Tailwind CSS
* **Animações:** Framer Motion
* **Backend:** PHP (API Bridge para OAuth2)

---

## APIs Integradas

* **Spotify API**
  Integração via **Client Credentials Flow**

* **Lanyard API**
  Status reativo via **Discord WebSocket**

* **WakaTime API**
  Métricas de produtividade

* **NASA APOD API**
  Conteúdo astronômico dinâmico

---

# ⚙️ Infraestrutura e CI/CD

* **GitHub Actions**
  Pipeline automatizado que realiza **build e deploy via FTP/SSH**

* **Hospedagem**
  Hostinger (Linux com suporte a **PHP 8.2+**)

* **Versionamento**
  Git com **branch main para produção**

---

# 📁 Estrutura de Pastas

```plaintext
felipe-portfolio/
├── public/
│   └── spotify.php           # Ponte segura para API do Spotify
│
├── src/
│   ├── components/
│   │   ├── SpotifyWidget.jsx # Lógica híbrida (PHP + Lanyard)
│   │   │
│   │   └── sections/
│   │       ├── Experience.jsx # Timeline estilo Git Branch
│   │       └── TechNews.jsx   # Feed dinâmico de notícias
```

---

# ⚙️ Como rodar o projeto localmente

## 1️⃣ Clone e instale

```bash
git clone https://github.com/fp-torres/felipeportfolio2.0.git
cd felipeportfolio2.0
npm install
```

---

## 2️⃣ Configure o servidor de API (PHP)

Como o projeto utiliza PHP para o Spotify, instale o **PHP CLI** e rode o servidor embutido:

```bash
php -S localhost:8000
```

---

## 3️⃣ Inicie o React

```bash
npm run dev
```

---

# 👨‍💻 Sobre o Autor

**Felipe Torres**
Desenvolvedor **Full Stack Trainee**

Apaixonado por criar interfaces que misturam **estética cyberpunk** com **funcionalidade robusta**.

GitHub:
https://github.com/fp-torres

---

# 🚀 Deploy Status

Esta versão dispara automaticamente o fluxo de **build e sincronização para produção** através do **GitHub Actions**.
