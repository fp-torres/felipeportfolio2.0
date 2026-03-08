# 🚀 Felipe Torres | Interactive Full Stack Portfolio v2.5

Um portfólio pessoal moderno, **altamente interativo e bilíngue (PT/EN)**, focado em métricas reais de produtividade e interações dinâmicas utilizando APIs externas.

🔗 **Visualizar Projeto Online**
*(adicione aqui o link do deploy)*

---

# ✨ O que há de novo (v2.5)

Além das funcionalidades base, o portfólio agora atua como um **Centro de Operações em tempo real**.

### 📊 WakaTime Integration

Dashboard dinâmico na seção **Tech Stack** que consome a **API do WakaTime** para exibir:

* Horas de codificação
* Linguagens mais utilizadas
* Estatísticas dos últimos **7 dias**

---

### 🎧 Spotify Live (Lanyard API)

Widget flutuante que detecta e exibe **em tempo real** o que estou ouvindo no Spotify.

Inclui:

* animação de **disco de vinil**
* **equalizador rítmico**
* atualização dinâmica via API

---

### 🛰️ NASA Easter Egg

Um **sinal de rádio oculto no Footer** (ícone de satélite).

Quando ativado:

* abre um **terminal holográfico**
* exibe a **Astronomy Picture of the Day (APOD)** da NASA

---

### 📈 Git-Style Timeline

Seção de experiência profissional redesenhada como um **branch de Git** contendo:

* logos reais das empresas
* badges de **"Atual"**
* visual inspirado em histórico de commits

---

### 🔄 CI/CD Automático

Pipeline de deploy automatizado utilizando **GitHub Actions**.

Fluxo:

1. Push na branch `main`
2. Build automático
3. Deploy via **FTP**
4. Sincronização com **Hostinger**

---

# 🕹️ Arcade Zone

Área de entretenimento desenvolvida **100% em React** com persistência de dados usando **localStorage**.

### Jogos disponíveis

🎮 **Tech Memory**
Encontre os pares dos ícones de tecnologia.

🐍 **Dev Snake**
Clássico jogo da cobrinha com controles **mobile-first**.

🎵 **Cyber Sequence**
Teste de memória rítmica utilizando **Web Audio API**.

🟩 **Matrix Recall**
Desafios de padrões visuais em grid progressivo.

🔐 **Decryptor**
Quebra de senhas e lógica criptográfica.

🧠 **Logic Quiz**
Desafios de **lógica de programação**.

---

# 🛠️ Tecnologias & APIs

## Core

* React.js
* Vite
* Tailwind CSS

## Animações

* Framer Motion

## APIs Externas

**WakaTime API**
Estatísticas reais de código.

**Lanyard API**
Ponte entre **Discord / Spotify** e o frontend.

**NASA APOD API**
Imagem astronômica diária da NASA.

---

# ⚙️ Infraestrutura

* GitHub Actions — **CI/CD automático**
* Hostinger — **Hospedagem**

---

# 📁 Estrutura de Pastas

Principais componentes adicionados ao projeto:

```plaintext
src/
├── components/
│   ├── SpotifyWidget.jsx   # Monitoramento dinâmico de música
│   ├── NasaModal.jsx       # Easter Egg interceptador de sinal
│   └── sections/
│       ├── WakaTime.jsx    # Dashboard de produtividade real
│       └── Experience.jsx  # Timeline estilo Git
```

---

# ⚙️ Como rodar o projeto localmente

### 1️⃣ Clone o repositório

```bash
git clone https://github.com/fp-torres/felipeportfolio2.0.git
```

---

### 2️⃣ Instale as dependências

```bash
npm install
```

---

### 3️⃣ Configure as chaves de API (opcional)

Para liberar todas as funcionalidades:

* Obtenha seu **Discord ID** para o Spotify Widget
* Gere uma **WakaTime JSON Shareable URL**
* Crie uma **NASA API Key** em
  https://api.nasa.gov

---

### 4️⃣ Inicie o servidor local

```bash
npm run dev
```

---

# 👨‍💻 Sobre o Autor

**Felipe Torres**
Full Stack Developer 

