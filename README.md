# 🚀 Felipe Torres | Interactive Full Stack Portfolio

> Um portfólio pessoal moderno, altamente interativo e bilíngue (PT/EN), construído para apresentar minha trajetória, projetos e habilidades como Desenvolvedor Full Stack, incluindo uma área exclusiva de mini-games embutidos.

🔗 **[Visualizar Projeto Online](https://felipeportfolio.forgedevapps.com/)**

---

## ✨ Principais Funcionalidades

- 🌍 **Internacionalização (i18n):** Suporte nativo para Português e Inglês. Os textos foram modularizados (`pt.js` e `en.js`) e gerenciados via Context API, permitindo troca de idioma em tempo real sem recarregar a página.
- 📱 **Mobile-First & Responsivo:** Layout adaptável para qualquer tamanho de tela, com otimização pesada de eventos de toque (`touch-action: none`, `onPointerDown`) para uma experiência mobile fluida.
- 🎨 **Animações Fluidas:** Transições de página, modais e micro-interações construídas com **Framer Motion**.
- 🎮 **Arcade Zone:** Uma seção de entretenimento embutida com 6 mini-games lógicos e clássicos.
- 📜 **Seções Dinâmicas:** Hero, Trajetória Profissional, Projetos, Certificações (com visualizador de imagens) e Tech Stack.

---

## 🕹️ Arcade Zone

O portfólio conta com uma área de "Arcade" desenvolvida 100% em React, onde os usuários podem jogar e registrar seus recordes locais (`localStorage`). 

1. **Tech Memory:** Encontre os pares dos ícones das linguagens e frameworks. (3 níveis de dificuldade).
2. **Dev Snake:** O clássico jogo da cobrinha com controles virtuais otimizados para mobile e prevenção de scroll.
3. **Cyber Sequence:** Jogo de memória rítmica e visual (estilo Genius) usando a *Web Audio API*.
4. **Matrix Recall:** Teste de memória de padrões visuais em um grid que aumenta de dificuldade.
5. **Decryptor:** Quebre a senha lógica descobrindo a posição e a cor correta dos símbolos (Estilo Mastermind).
6. **Logic Quiz (Zip):** Responda rapidamente a sequências lógicas e conhecimentos gerais de TI.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React.js, Vite
- **Estilização:** Tailwind CSS
- **Animações:** Framer Motion
- **Ícones:** Iconify (`@iconify/react`) & DevIcons
- **Gerenciamento de Estado:** React Hooks (`useState`, `useEffect`, `useRef`, Context API)
- **Armazenamento Local:** `localStorage` para salvar configurações e *High Scores* dos jogos.

---

## 📁 Estrutura de Pastas (Resumo)

A arquitetura do projeto foi pensada para ser escalável e de fácil manutenção:

```text
src/
├── assets/         # Imagens, PDFs (Currículos), Certificados
├── components/     # Componentes reutilizáveis
│   ├── games/      # Lógica e UI individual de cada mini-game
│   └── sections/   # Seções maiores da página (Hero, GameHub, etc.)
├── context/        # Context API (LanguageContext)
├── data/           # Arquivos de dados estáticos e traduções
│   ├── content.js  # Hub de exportação de idiomas
│   ├── pt.js       # Textos em Português
│   └── en.js       # Textos em Inglês
├── App.jsx         # Raiz da aplicação
└── main.jsx        # Ponto de entrada do React
⚙️ Como rodar o projeto localmente
Siga os passos abaixo para clonar e rodar o projeto na sua máquina:

Clone o repositório:

Bash
git clone [https://github.com/fp-torres/felipeportfolio2.0.git](https://github.com/fp-torres/felipeportfolio2.0.git)
Acesse a pasta do projeto:

Bash
cd felipeportfolio2.0
Instale as dependências:

Bash
npm install
Inicie o servidor de desenvolvimento:

Bash
npm run dev
O aplicativo estará rodando em http://localhost:5173.

👨‍💻 Sobre o Autor
Felipe Torres | Desenvolvedor Full Stack

💼 Atual: Desenvolvedor Trainee na Crase Sigma

🎓 Formação: Análise e Desenvolvimento de Sistemas (UVA) | Técnico em TI (Colégio Santo Inácio)

🔗 LinkedIn

🐙 GitHub

<p align="center">
Feito com ☕ e código por Felipe Torres.
</p>