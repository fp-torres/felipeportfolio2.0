// Imagens Principais
import profileImg from '../assets/imgs/img2.jpg';

// Imagens de Projetos
import logoNfse from '../assets/imgs/logo-nfs-e-horizontal.png'; // NOVO PROJETO (Emissor NFS-e)
import torresBurgerImg from '../assets/imgs/web-home-dark.png'; 
import forgeImg from '../assets/imgs/forgedevapps.png'; 
import costsImg from '../assets/imgs/costs.jpeg';
import steakImg from '../assets/imgs/img4.png'; 

// --- PREVIEWS DOS CURRÍCULOS (INGLÊS) ---
import imgCvModernEn from '../assets/imgs/preview-cv-moderno-en.png';
import imgCvCorporateEn from '../assets/imgs/preview-cv-corporativo-en.png';

// Currículos PDFs (Versão Inglês)
import cvCompleteEn from '../assets/curriculo/cv_Felipe_Torres_en.pdf';
import cvFocusedEn from '../assets/curriculo/Felipe_Torres_cv_en.pdf';
import diplomaTecnico from '../assets/curriculo/Diploma Técnico de Informática.pdf';

// Certificados
import certIotIaPucrs from '../assets/imgs/certs/CURSO DE EXTENSÃO EM INTERNET DAS COISAS, IA E A REVOLUÇÃO CONECTADA PUCRS.png'; 
import certDbAdmin from '../assets/imgs/certs/Administrando Banco de Dados.png';
import certHardware from '../assets/imgs/certs/Fundamentos de TI - Hardware e Software.png';
import certImplDb from '../assets/imgs/certs/Implementando Banco de Dados.png';
import certCyber from '../assets/imgs/certs/Introduction to Cybersecurity.png';
import certIot from '../assets/imgs/certs/Introduction to LOT.png';
import certGit from '../assets/imgs/certs/Introdução ao Git e GitHub.png';
import certGestao from '../assets/imgs/certs/Introdução à Gestão de Projetos.png';
import certPoo from '../assets/imgs/certs/Introdução à Programação Orientada a Objetos (POO).png';
import certModeling from '../assets/imgs/certs/Modelagem de Dados.png';
import certRiw from '../assets/imgs/certs/Rio Innovation Week 2023.png';
import certSecurity from '../assets/imgs/certs/Segurança em Tecnologia da Informação.png';
import certScrum from '../assets/imgs/certs/scrumcertificado.png'; 

export const en = {
  nav: {
    home: "Home",
    experience: "Career",
    projects: "Projects",
    certificates: "Certificates",
    skills: "Stack",
    minigames: "Minigames",
    contact: "Contact",
  },
  hero: {
    name: "Felipe Torres",
    role: "Full Stack Developer",
    image: profileImg,
    ctaResume: "Download CV",
    aboutTitle: "About Me",
    aboutText: "Full Stack Developer focused on React, Node.js, Java, and modern architecture. I transform complex ideas into robust and scalable software.",
    recentActivity: "Recent Activity:",
    location: "Rio de Janeiro, BR",
    available: "Available",
    currentFocus: "Current Focus",
    githubStats: {
      repos: "Repositories",
      followers: "Followers",
      profileBtn: "View GitHub Profile"
    }
  },
  
  cvModal: {
    title: "Choose Resume Format",
    subtitle: "The same structured content in two different formats to fit any recruitment stage.",
    modern: {
      title: "Modern Design",
      desc: "Styled design with photo. Great for human reading, direct email applications, and networking.",
      link: cvCompleteEn,
      fileName: "cv_Felipe_Torres_en.pdf",
      image: imgCvModernEn
    },
    corporate: {
      title: "Corporate Format (ATS)",
      desc: "Clean and traditional. 100% readable for automated Applicant Tracking Systems (ATS).",
      link: cvFocusedEn,
      fileName: "Felipe_Torres_cv_en.pdf",
      image: imgCvCorporateEn
    }
  },

  experience: {
    title: "Professional Path",
    educationTitle: "Education",
    items: [
      {
        id: 1,
        role: "Full Stack Developer",
        company: "Crase Sigma",
        period: "01/2026 - Present",
        description: "Development of complete web systems. Direct involvement in business rules, API integration, and performance optimization.",
        current: true,
        icon: "solar:code-square-bold"
      },
      {
        id: 2,
        role: "IT Intern",
        company: "Allternativa Filmes X",
        period: "Apr 2023 - Jul 2023",
        description: "Technical support, infrastructure maintenance, and internal systems assistance.",
        icon: "solar:monitor-camera-bold"
      }
    ],
    education: [
      {
        id: 1,
        course: "Systems Analysis",
        school: "Universidade Veiga de Almeida",
        period: "2024 - 2026",
        diploma: null,
        icon: "mdi:university"
      },
      {
        id: 2,
        course: "IT Technician",
        school: "Colégio Santo Inácio",
        period: "2022 - 2023",
        diploma: diplomaTecnico,
        icon: "mdi:school"
      }
    ]
  },
  projects: {
    title: "Projects",
    items: [
{
        id: 5,
        title: "National NFS-e Issuer",
        description: "[Private System] Highly complex corporate architecture for electronic tax invoice emission. Python core handles PFX certificates, XML signing, and mTLS communication with SEFIN.",
        image: logoNfse,
        containImage: true, 
        details: "The National NFS-e Issuer is a private corporate ecosystem designed to prepare, validate, sign, and securely transmit electronic tax invoices autonomously.\n\nUnlike traditional web applications, this project demands high fiscal reliability and strict security. The core was built in Python, handling the complexity of mTLS cryptography, XML digital signatures following government standards, and the secure manipulation of PFX digital certificates.\n\nThe architecture strictly follows Clean Architecture principles, ensuring that fiscal rules remain isolated. The system features a robust Flask API and a componentized React frontend (using Vite and Tailwind CSS), unifying both single and batch emission flows (processing thousands of invoices simultaneously).\n\nTo ensure production stability, strict security locks were implemented: backend concurrency blocking, real-time revalidation of Service Provision Documents (DPS) right before SEFIN transmission, automated testing, and comprehensive log preservation to guarantee full traceability during government server downtimes.",
        techs: ["Python", "Flask", "React", "XML/mTLS", "Tailwind CSS"],
        link: null,
        github: null,
        video: null
      },
      {
        id: 4, 
        title: "TorresBurgers Full Stack",
        description: "Complete burger shop system with admin dashboard, real-time ordering, and inventory management.",
        image: torresBurgerImg,
        techs: ["React", "Node.js", "Express", "MySQL"],
        link: null,
        github: "https://github.com/fp-torres/TorresBurguers",
        video: null
      },
      {
        id: 1,
        title: "ForgeDevApps",
        description: "Institutional platform focused on high performance.",
        image: forgeImg,
        techs: ["React", "Tailwind", "Full Stack Concept"],
        link: "https://forgedevapps.com", 
        github: "#",
        video: null
      },
      {
        id: 2,
        title: "Costs - Financial Manager",
        description: "Complete cost and project management system. Allows dynamic service creation and budgeting.",
        image: costsImg,
        techs: ["React", "Json Server", "CRUD"],
        link: null, 
        github: "https://github.com/fp-torres/projeto-react",
        video: "https://www.linkedin.com/posts/felipe-torres-id_reactjs-frontend-webdevelopment-ugcPost-7399171341473460224-iJ9u"
      },
      {
        id: 3,
        title: "Steak Burger",
        description: "Web application for digital menu.",
        image: steakImg,
        techs: ["HTML", "CSS", "JS"],
        link: "https://steakburger.forgedevapps.com",
        github: "https://github.com/fp-torres/stackburguer",
        video: null
      }
    ]
  },
  certificates: {
    title: "Certifications",
    seeMore: "See All",
    seeLess: "See Less",
    items: [
      { id: 13, name: "IoT, AI & Connected Revolution", issuer: "PUCRS",             image: certIotIaPucrs }, 
      { id: 12, name: "Scrum Fundamentals Certified", issuer: "SCRUMstudy",          image: certScrum }, 
      { id: 1,  name: "OOP - Java",                   issuer: "Online Course",       image: certPoo },
      { id: 2,  name: "Git & GitHub",                 issuer: "Online Course",       image: certGit },
      { id: 3,  name: "DB Admin",                     issuer: "Fundação Bradesco",   image: certDbAdmin },
      { id: 4,  name: "Impl DB",                      issuer: "Fundação Bradesco",   image: certImplDb },
      { id: 5,  name: "Data Modeling",                issuer: "Fundação Bradesco",   image: certModeling },
      { id: 6,  name: "IT Security",                  issuer: "Bradesco",            image: certSecurity },
      { id: 7,  name: "Cybersecurity Intro",          issuer: "Cisco",               image: certCyber },
      { id: 8,  name: "Project Mgmt",                 issuer: "Fundação Bradesco",   image: certGestao },
      { id: 9,  name: "IoT Intro",                    issuer: "Cisco",               image: certIot },
      { id: 10, name: "Hardware & Software",          issuer: "Cisco",               image: certHardware },
      { id: 11, name: "Rio Innovation Week",          issuer: "Participation 2023",  image: certRiw },
    ]
  },
  skills: {
    title: "Tech Stack",
    list: [
      { name: "React",      icon: "devicon-react-original"      },
      { name: "Vite",       icon: "devicon-vite-original"       },
      { name: "Node.js",    icon: "devicon-nodejs-plain"        },
      { name: "PHP",        icon: "devicon-php-plain"           },
      { name: "Laravel",    icon: "devicon-laravel-plain"       },
      { name: "Python",     icon: "devicon-python-plain"        },
      { name: "Java",       icon: "devicon-java-plain"          },
      { name: "JavaScript", icon: "devicon-javascript-plain"    },
      { name: "TypeScript", icon: "devicon-typescript-plain"    },
      { name: "HTML5",      icon: "devicon-html5-plain"         },
      { name: "CSS3",       icon: "devicon-css3-plain"          },
      { name: "Tailwind",   icon: "devicon-tailwindcss-original"},
      { name: "MySQL",      icon: "devicon-mysql-plain"         },
      { name: "Docker",     icon: "devicon-docker-plain"        },
      { name: "Git",        icon: "devicon-git-plain"           },
      { name: "GitHub",     icon: "devicon-github-original"     },
      { name: "Linux",      icon: "devicon-linux-plain"         },
      { name: "Windows",    icon: "devicon-windows8-original"   },
      { name: "MacOS",      icon: "devicon-apple-original"      },
      { name: "Vue.js",     icon: "devicon-vuejs-plain"         },
      { name: "Angular",    icon: "devicon-angularjs-plain"     },
    ]
  },

  minigames: {
    sectionTitle: "Arcade Zone",
    sectionSubtitle: "Challenge your mind with our mini-games.",

    common: {
      score:     "Score",
      record:    "Record",
      level:     "Level",
      max:       "Max",
      moves:     "Moves",
      time:      "Time",
      lives:     "lives",
      win:       "You Won!",
      gameOver:  "Game Over",
      playAgain: "Play Again",
      restart:   "Restart",
      back:      "Back",
      quit:      "Main Menu",
      nextLevel: "Next Level",
      tryAgain:  "Try Again",
      exit:      "Exit",
    },

    descriptions: {
      memory:    { title: "Tech Memory",    desc: "Find the technology pairs."         },
      snake:     { title: "Dev Snake",      desc: "Classic Snake with tech visuals."   },
      sequence:  { title: "Cyber Sequence", desc: "Repeat the colour sequence."        },
      matrix:    { title: "Matrix Recall",  desc: "Memorize and repeat the pattern."   },
      decryptor: { title: "Decryptor",      desc: "Crack the secret logic password."   },
      zip:       { title: "Logic Quiz",     desc: "Quick logic questions."             },
    },

    memory: {
      title:      "Tech Memory",
      subtitle:   "Test your memory across different levels.",
      bestScore:  "Best",
      moves:      "Moves",
      winTitle:   "Well Done!",
      winSubtitle:"Completed in",
      newRecord:  "🏆 NEW RECORD!",
      playAgain:  "Play Again",
      modes: {
        easy:   "Easy",
        medium: "Medium",
        hard:   "Hard",
      },
    },

    snake: {
      title:          "Dev Snake",
      start:          "Start",
      help:           "WASD / Arrows to move · Space to pause",
      helpMobile:     "Use the D-pad to move",
      pauseHint:      "Press Space to resume",
      pauseHintMobile:"Tap ⏸ to resume",
      controls:       "WASD / Arrows · Space = pause",
      controlsMobile: "D-pad to move",
      goldenFood:     "Golden food = 30 pts",
      newRecord:      "🏆 New Record!",
      levelReached:   "reached",
    },

    sequence: {
      title:       "Cyber Sequence",
      start:       "Start",
      turn:        "Your turn!",
      watch:       "Watch carefully...",
      wrong:       "Game Over!",
      phaseLabel:  "round",
      phaseComplete: "✓ Round {n} complete!",
      livesLeft:     "✗ Wrong! {n} {life} remaining",
      life:          "life",
      lives:         "lives",
    },

    matrix: {
      title:       "Matrix Recall",
      start:       "Start",
      description: "Memorize the highlighted tiles, then repeat the pattern from memory.",
      memorize:    "MEMORIZE!",
      repeat:      "Repeat the pattern.",
      success:     "SUCCESS!",
      fail:        "SYSTEM FAILURE",
      phaseLabel:  "level",
      goldenHint:  "+1 life available",
      goldenUsed:  "+1 life!",
    },

    decryptor: {
      title:         "Decryptor",
      accessGranted: "ACCESS GRANTED!",
      accessDenied:  "ACCESS DENIED",
      cracked:       "You cracked the encryption.",
      enter:         "ENTER",
      hint:          "Hint",
      hintUsed:      "Used",
      hintRow:       "Hint: position",
      exactMatch:    "Correct Position",
      partialMatch:  "Right Symbol, Wrong Spot",
      placeholder:   "Select icons below to guess the password.",
      tries:         "tries",
      remaining:     "left",
      attemptsUsed:  "attempts used",
      nextChallenge: "Next challenge unlocked",
      codeWas:       "The code was:",
      allAttempts:   "All attempts",
    },

    zip: {
      title:        "Logic Quiz",
      subtitle:     "LOGIC QUIZ",
      hint:         "Hint:",
      showHint:     "Show hint",
      hideHint:     "Hide hint",
      correct:      "CORRECT!",
      wrong:        "WRONG!",
      bonus:        "bonus",
      hackComplete: "HACK COMPLETE!",
      placeholder:  "Answer...",
      levels: [
        { id: 1,  question: "2, 4, 6, 8, ...",               answer: "10",       hint: "Even numbers."                          },
        { id: 2,  question: "5, 10, 15, 20, ...",            answer: "25",       hint: "Multiples of 5."                        },
        { id: 3,  question: "1, 2, 4, 8, 16, ...",           answer: "32",       hint: "Double the previous."                   },
        { id: 4,  question: "10 - 5 + 2 = ?",               answer: "7",        hint: "Basic math."                            },
        { id: 5,  question: "A, B, C, D, ...",               answer: "E",        hint: "Alphabet."                              },
        { id: 6,  question: "1, 1, 2, 3, 5, 8, ...",        answer: "13",       hint: "Fibonacci (sum of previous two)."       },
        { id: 7,  question: "HTML, CSS, JS, ...",            answer: "REACT",    hint: "Popular Frontend Stack."                },
        { id: 8,  question: "100, 90, 80, 70, ...",          answer: "60",       hint: "Countdown by 10."                       },
        { id: 9,  question: "0, 1, 10, 11, 100, ...",        answer: "101",      hint: "Binary sequence."                       },
        { id: 10, question: "const x = 5; x + 1 = ?",       answer: "6",        hint: "Basic JavaScript."                      },
        { id: 11, question: "3, 6, 9, 12, ...",              answer: "15",       hint: "Multiples of 3."                        },
        { id: 12, question: "Mon, Tue, Wed, ...",            answer: "THURSDAY", hint: "Days of the week."                      },
        { id: 13, question: "10² = ?",                       answer: "100",      hint: "Exponentiation."                        },
        { id: 14, question: "[1, 2, 3].length = ?",          answer: "3",        hint: "Array length."                          },
        { id: 15, question: "#FF0000 is which color?",       answer: "RED",      hint: "Hex color code."                        },
      ],
    },
  },

  footer: {
    title:     "Let's build something amazing?",
    subtitle:  "I'm available for new projects and Full Stack opportunities.",
    emailBtn:  "Send Email",
    copyright: "© 2026 Felipe Torres. All rights reserved.",
  },
};