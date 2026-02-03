import { Icon } from '@iconify/react';

// Imagens Principais
import profileImg from '../assets/imgs/img2.jpg';

// Imagens de Projetos
import forgeImg from '../assets/imgs/forgedevapps.png'; 
import costsImg from '../assets/imgs/costs.jpeg';
import steakImg from '../assets/imgs/img4.png'; 

// Currículos
import cvPt from '../assets/curriculo/cvfelipetorres.pdf';
import cvEn from '../assets/curriculo/enresumefelipetorres.pdf';
import diplomaTecnico from '../assets/curriculo/Diploma Técnico de Informática.pdf';

// Certificados
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

export const content = {
  pt: {
    nav: {
      home: "Início",
      experience: "Carreira",
      projects: "Projetos",
      certificates: "Certificados",
      skills: "Stack",
      minigame: "Minigame",
      contact: "Contato",
    },
    hero: {
      name: "Felipe Torres",
      role: "Desenvolvedor Full Stack",
      image: profileImg,
      resumeLink: cvPt,
      ctaResume: "Baixar CV",
      aboutTitle: "Sobre Mim", // Novo
      aboutText: "Desenvolvedor Full Stack com foco em React, Node.js e arquitetura moderna. Transformo ideias complexas em software robusto e escalável.",
      recentActivity: "Atividade Recente:", // Novo
      location: "Rio de Janeiro, BR",
      available: "Disponível",
      currentFocus: "Foco Atual",
      githubStats: {
        repos: "Repositórios",
        followers: "Seguidores",
        profileBtn: "Ver Perfil GitHub"
      }
    },
    experience: {
      title: "Trajetória Profissional",
      educationTitle: "Formação Acadêmica", // Novo (para usar no componente Experience)
      items: [
        {
          id: 1,
          role: "Desenvolvedor Trainee",
          company: "Crase Sigma",
          period: "2026 - Atual",
          description: "Desenvolvimento de sistemas web completos. Atuação direta na regra de negócio, integração de APIs e otimização de performance.",
          current: true
        },
        {
          id: 2,
          role: "Estagiário de TI",
          company: "Allternativa Filmes X",
          period: "Abr 2023 - Jul 2023",
          description: "Suporte técnico, manutenção de infraestrutura e auxílio na gestão de sistemas internos."
        }
      ],
      education: [
        {
          id: 1,
          course: "Análise e Desenvolvimento de Sistemas",
          school: "Universidade Veiga de Almeida",
          period: "2024 - 2026",
          diploma: null 
        },
        {
          id: 2,
          course: "Técnico em TI - Desenvolvimento Web",
          school: "Colégio Santo Inácio",
          period: "2022 - 2023",
          diploma: diplomaTecnico
        }
      ]
    },
    projects: {
      title: "Projetos",
      items: [
        {
          id: 1,
          title: "ForgeDevApps",
          description: "Plataforma institucional focada em alta performance e conversão.",
          image: forgeImg,
          techs: ["React", "Tailwind", "Full Stack Concept"],
          link: "https://forgedevapps.com", 
          github: "#",
          video: null
        },
        {
          id: 2,
          title: "Costs - Gerenciador Financeiro",
          description: "Sistema completo de gerenciamento de custos e projetos. Permite criação dinâmica de serviços e orçamentos.",
          image: costsImg,
          techs: ["React", "Json Server", "CRUD"],
          link: null, 
          github: "https://github.com/fp-torres/projeto-react",
          video: "https://www.linkedin.com/posts/felipe-torres-id_reactjs-frontend-webdevelopment-ugcPost-7399171341473460224-iJ9u"
        },
        {
          id: 3,
          title: "Steak Burger",
          description: "Aplicação web para pedidos e cardápio digital.",
          image: steakImg,
          techs: ["HTML", "CSS", "JS"],
          link: "https://steakburger.forgedevapps.com",
          github: "https://github.com/fp-torres/stackburguer",
          video: null
        }
      ]
    },
    certificates: {
      title: "Certificações",
      seeMore: "Ver Todos",
      seeLess: "Ver Menos",
      items: [
        { id: 1, name: "POO - Java", issuer: "Curso em Vídeo", image: certPoo },
        { id: 2, name: "Git e GitHub", issuer: "Curso em Vídeo", image: certGit },
        { id: 3, name: "Adm. Banco de Dados", issuer: "Fundação Bradesco", image: certDbAdmin },
        { id: 4, name: "Implementação de BD", issuer: "Fundação Bradesco", image: certImplDb },
        { id: 5, name: "Modelagem de Dados", issuer: "Fundação Bradesco", image: certModeling },
        { id: 6, name: "Segurança em TI", issuer: "Bradesco", image: certSecurity },
        { id: 7, name: "Cybersecurity Intro", issuer: "Cisco", image: certCyber },
        { id: 8, name: "Gestão de Projetos", issuer: "Fundação Bradesco", image: certGestao },
        { id: 9, name: "IoT Intro", issuer: "Cisco", image: certIot },
        { id: 10, name: "Hardware e Software", issuer: "Cisco", image: certHardware },
        { id: 11, name: "Rio Innovation Week", issuer: "Participação 2023", image: certRiw },
      ]
    },
    skills: {
      title: "Tech Stack",
      list: [
        { name: "React", icon: "devicon-react-original" },
        { name: "Angular", icon: "devicon-angularjs-plain" },
        { name: "Vue.js", icon: "devicon-vuejs-plain" },
        { name: "Node.js", icon: "devicon-nodejs-plain" },
        { name: "PHP", icon: "devicon-php-plain" },
        { name: "Laravel", icon: "devicon-laravel-plain" },
        { name: "Python", icon: "devicon-python-plain" },
        { name: "JavaScript", icon: "devicon-javascript-plain" },
        { name: "TypeScript", icon: "devicon-typescript-plain" },
        { name: "MySQL", icon: "devicon-mysql-plain" },
        { name: "Docker", icon: "devicon-docker-plain" },
        { name: "Git", icon: "devicon-git-plain" },
        { name: "Linux", icon: "devicon-linux-plain" },
        { name: "Windows", icon: "devicon-windows8-original" },
        { name: "MacOS", icon: "devicon-apple-original" },
        { name: "Tailwind", icon: "devicon-tailwindcss-original" },
      ]
    },
    minigame: {
      title: "Tech Memory",
      subtitle: "Encontre os pares para testar a sua memória.",
      moves: "Jogadas",
      restart: "Reiniciar",
      winTitle: "Mandou Bem!",
      winSubtitle: "Você completou em",
      playAgain: "Jogar Novamente"
    },
    footer: {
      title: "Vamos construir algo incrível?",
      subtitle: "Estou disponível para novos projetos e oportunidades como Full Stack.",
      emailBtn: "Mandar Email",
      copyright: "© 2026 Felipe Torres. Todos os direitos reservados."
    }
  },
  en: {
    nav: {
      home: "Home",
      experience: "Career",
      projects: "Projects",
      certificates: "Certificates",
      skills: "Stack",
      minigame: "Minigame",
      contact: "Contact",
    },
    hero: {
      name: "Felipe Torres",
      role: "Full Stack Developer",
      image: profileImg,
      resumeLink: cvEn,
      ctaResume: "Download CV",
      aboutTitle: "About Me", // Novo
      aboutText: "Full Stack Developer focused on React, Node.js, and modern architecture. I transform complex ideas into robust and scalable software.",
      recentActivity: "Recent Activity:", // Novo
      location: "Rio de Janeiro, BR",
      available: "Available",
      currentFocus: "Current Focus",
      githubStats: {
        repos: "Repositories",
        followers: "Followers",
        profileBtn: "View GitHub Profile"
      }
    },
    experience: {
      title: "Professional Path",
      educationTitle: "Education", // Novo
      items: [
        {
          id: 1,
          role: "Trainee Developer",
          company: "Crase Sigma",
          period: "2026 - Present",
          description: "Development of complete web systems. Direct involvement in business rules, API integration, and performance optimization.",
          current: true
        },
        {
          id: 2,
          role: "IT Intern",
          company: "Allternativa Filmes X",
          period: "Apr 2023 - Jul 2023",
          description: "Technical support, infrastructure maintenance, and internal systems assistance."
        }
      ],
      education: [
        {
          id: 1,
          course: "Systems Analysis",
          school: "Universidade Veiga de Almeida",
          period: "2024 - 2026",
          diploma: null 
        },
        {
          id: 2,
          course: "IT Technician",
          school: "Colégio Santo Inácio",
          period: "2022 - 2023",
          diploma: diplomaTecnico
        }
      ]
    },
    projects: {
      title: "Projects",
      items: [
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
        { id: 1, name: "OOP - Java", issuer: "Online Course", image: certPoo },
        { id: 2, name: "Git & GitHub", issuer: "Online Course", image: certGit },
        { id: 3, name: "DB Admin", issuer: "Fundação Bradesco", image: certDbAdmin },
        { id: 4, name: "Impl DB", issuer: "Fundação Bradesco", image: certImplDb },
        { id: 5, name: "Data Modeling", issuer: "Fundação Bradesco", image: certModeling },
        { id: 6, name: "IT Security", issuer: "Bradesco", image: certSecurity },
        { id: 7, name: "Cybersecurity Intro", issuer: "Cisco", image: certCyber },
        { id: 8, name: "Project Mgmt", issuer: "Fundação Bradesco", image: certGestao },
        { id: 9, name: "IoT Intro", issuer: "Cisco", image: certIot },
        { id: 10, name: "Hardware & Software", issuer: "Cisco", image: certHardware },
        { id: 11, name: "Rio Innovation Week", issuer: "Participation 2023", image: certRiw },
      ]
    },
    skills: {
      title: "Tech Stack",
      list: [
        { name: "React", icon: "devicon-react-original" },
        { name: "Angular", icon: "devicon-angularjs-plain" },
        { name: "Vue.js", icon: "devicon-vuejs-plain" },
        { name: "Node.js", icon: "devicon-nodejs-plain" },
        { name: "PHP", icon: "devicon-php-plain" },
        { name: "Laravel", icon: "devicon-laravel-plain" },
        { name: "Python", icon: "devicon-python-plain" },
        { name: "JavaScript", icon: "devicon-javascript-plain" },
        { name: "TypeScript", icon: "devicon-typescript-plain" },
        { name: "MySQL", icon: "devicon-mysql-plain" },
        { name: "Docker", icon: "devicon-docker-plain" },
        { name: "Git", icon: "devicon-git-plain" },
        { name: "Linux", icon: "devicon-linux-plain" },
        { name: "Windows", icon: "devicon-windows8-original" },
        { name: "MacOS", icon: "devicon-apple-original" },
        { name: "Tailwind", icon: "devicon-tailwindcss-original" },
      ]
    },
    minigame: {
      title: "Tech Memory",
      subtitle: "Find the pairs to test your memory.",
      moves: "Moves",
      restart: "Restart",
      winTitle: "Well Done!",
      winSubtitle: "You completed it in",
      playAgain: "Play Again"
    },
    footer: {
      title: "Let's build something amazing?",
      subtitle: "I'm available for new projects and Full Stack opportunities.",
      emailBtn: "Send Email",
      copyright: "© 2026 Felipe Torres. All rights reserved."
    }
  }
};