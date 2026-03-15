# 🚀 Felipe Torres | Interactive Full Stack Portfolio

<div align="center">

![Visitor Count](https://komarev.com/ghpvc/?username=fp-torres&color=blueviolet&style=for-the-badge)

[![Portfolio](https://img.shields.io/badge/🌐_Live_Portfolio-000?style=for-the-badge&logo=vercel&logoColor=white)](https://felipeportfolio.forgedevapps.com/)
[![GitHub](https://img.shields.io/badge/GitHub-fp--torres-181717?style=for-the-badge&logo=github)](https://github.com/fp-torres)

</div>

---

# 🧑‍💻 About The Project

An **immersive, high-performance and bilingual (PT/EN) personal portfolio** built to showcase my work as a developer and audiovisual editor.

This project evolved from a simple static site into a **hybrid full-stack application with its own API infrastructure**, designed for **resilience, performance and independence from third-party services**.

🔗 **Live Website**

https://felipeportfolio.forgedevapps.com/

---

# 🎥 Live Preview

<p align="center">

<img src="https://felipeportfolio.forgedevapps.com/preview.gif" width="800">

</p>

---

# ⚡ Main Features

## 🎧 Spotify Direct API (Hybrid System)

Custom music widget powered by a **self-hosted API bridge**.

Features:

- Secure **PHP proxy** for Spotify OAuth2
- Works **independently from Discord**
- **Automatic fallback** to Discord Lanyard API
- Real-time music detection

Result: **24/7 uptime music status.**

---

## 🛰️ NASA Easter Egg (APOD)

Hidden feature accessible through a **radio signal interaction in the website footer**.

Capabilities:

- Fetches **Astronomy Picture of the Day**
- Animated **holographic modal**
- Error handling and loading animations

---

## 📊 WakaTime Analytics

Real coding statistics pulled from the **WakaTime API**.

Displays:

- Coding activity
- Language usage
- Real developer metrics

---

## 📱 Mobile-First Architecture

The entire UI was refactored to ensure **perfect mobile experience**.

Includes:

- Touch optimized interactions
- Conditional rendering for performance
- Smooth animations with **Framer Motion**

---

## 🕹️ Arcade Zone

Interactive entertainment area fully built in **React**.

Games included:

🎮 **Tech Memory**  
Memory game using tech stack icons

🐍 **Dev Snake**  
Classic Snake adapted for **mobile D-Pad controls**

🎵 **Cyber Sequence**  
Audio-based memory game using **Web Audio API**

🧠 **Logic Quiz**  
Programming logic challenges

High scores are stored locally.

---

# 🛠️ Tech Stack

<div align="center">

<img src="https://skillicons.dev/icons?i=react,vite,tailwind,php,js,html,css,git,github,linux&perline=5" />

</div>

---

# 🧱 Architecture

| Layer | Technology |
|------|------------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Backend Proxy | PHP |
| APIs | Spotify, Lanyard, WakaTime, NASA |
| Hosting | Linux Server |
| CI/CD | GitHub Actions |
| Version Control | Git |

---

# ⚙️ CI/CD Pipeline

The project uses **GitHub Actions** for automated deployment.

Workflow:

1️⃣ Push to `main`  
2️⃣ Vite production build runs automatically  
3️⃣ Files deploy to **Hostinger server via FTP/SSH**  
4️⃣ Sensitive files ignored via `.gitignore`

Example ignored file:


config.php


---

# 📂 Project Structure

```text
felipeportfolio2.0/
│
├── public/
│   ├── config.php
│   └── spotify.php
│
├── src/
│   ├── components/
│   │   ├── SpotifyWidget.jsx
│   │   └── sections/
│   │       ├── Experience.jsx
│   │       └── TechNews.jsx
│   │
│   └── context/
│       └── LanguageContext.jsx
🚀 Running Locally
1️⃣ Clone Repository
git clone https://github.com/fp-torres/felipeportfolio2.0.git

cd felipeportfolio2.0

npm install
2️⃣ Configure Spotify API

Create:

public/config.php

Add:

CLIENT_ID

CLIENT_SECRET

REFRESH_TOKEN

Start PHP server:

php -S localhost:8000 -t public
3️⃣ Start Frontend
npm run dev

Open:

http://localhost:5173

The React app will communicate with the PHP API bridge automatically.

📊 GitHub Stats
<div align="center">

</div>
🧑‍💻 Author

Felipe Torres

Trainee Developer

📍 Rio de Janeiro, Brazil