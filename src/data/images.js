// Every image the content files (pt.js / en.js) use, declared once and processed by vite-imagetools.
// At build time each import becomes WebP files at the listed widths. Widths above the original are clamped to
// it (no upscaling), and the originals in src/assets stay untouched (sharp converts their colour profiles to sRGB).
// Each entry is { src, srcSet }: `src` is the largest variant, `srcSet` lists them all. Render
// <img src={src} srcSet={srcSet} sizes="…"> with `sizes` matching the rendered width, so phones get small
// files and retina screens get sharp ones.
// To add an image: import it below with the query of its group, export it, then use it in pt.js and en.js.

// Portrait: 112px circle on phones, 256–288px card on desktop (1x–3x).
import portraitImg from '../assets/imgs/img2.jpg?w=256;384;512;768&format=webp&quality=80&as=img';

// CV previews: 72px thumbnails on phones, ~226px cards on desktop.
import cvModernPtImg from '../assets/imgs/preview-cv-moderno-pt.png?w=240;480;800&format=webp&quality=78&as=img';
import cvCorporatePtImg from '../assets/imgs/preview-cv-corporativo-pt.png?w=240;480;800&format=webp&quality=78&as=img';
import cvModernEnImg from '../assets/imgs/preview-cv-moderno-en.png?w=240;480;800&format=webp&quality=78&as=img';
import cvCorporateEnImg from '../assets/imgs/preview-cv-corporativo-en.png?w=240;480;800&format=webp&quality=78&as=img';

// Projects: full-width cards on phones, half/featured width on desktop, detail sheet.
import nfseImg from '../assets/imgs/logo-nfs-e-horizontal.png?w=480;800;1200;1600&format=webp&quality=78&as=img';
import torresBurgersImg from '../assets/imgs/web-home-dark.png?w=480;800;1200;1600&format=webp&quality=78&as=img';
import forgeDevAppsImg from '../assets/imgs/forgedevapps.png?w=480;800;1200;1600&format=webp&quality=78&as=img';
// costs-crop.png = costs.jpeg without the browser tabs, address bar and bookmarks bar.
import costsImg from '../assets/imgs/costs-crop.png?w=480;800;1200;1600&format=webp&quality=78&as=img';
import steakBurgerImg from '../assets/imgs/img4.png?w=480;800;1200;1600&format=webp&quality=78&as=img';

// Certificates: gallery cards (~78vw on phones, 18rem on desktop) and the detail sheet.
import certJavaUdemyImg from '../assets/imgs/certs/java-primeiros-passos-udemy.jpg?w=480;800;1200&format=webp&quality=78&as=img';
import certIotIaPucrsImg from '../assets/imgs/certs/CURSO DE EXTENSÃO EM INTERNET DAS COISAS, IA E A REVOLUÇÃO CONECTADA PUCRS.png?w=480;800;1200&format=webp&quality=78&as=img';
import certScrumImg from '../assets/imgs/certs/scrumcertificado.png?w=480;800;1200&format=webp&quality=78&as=img';
import certPooImg from '../assets/imgs/certs/Introdução à Programação Orientada a Objetos (POO).png?w=480;800;1200&format=webp&quality=78&as=img';
import certGitImg from '../assets/imgs/certs/Introdução ao Git e GitHub.png?w=480;800;1200&format=webp&quality=78&as=img';
import certDbAdminImg from '../assets/imgs/certs/Administrando Banco de Dados.png?w=480;800;1200&format=webp&quality=78&as=img';
import certImplDbImg from '../assets/imgs/certs/Implementando Banco de Dados.png?w=480;800;1200&format=webp&quality=78&as=img';
import certModelingImg from '../assets/imgs/certs/Modelagem de Dados.png?w=480;800;1200&format=webp&quality=78&as=img';
import certSecurityImg from '../assets/imgs/certs/Segurança em Tecnologia da Informação.png?w=480;800;1200&format=webp&quality=78&as=img';
import certCyberImg from '../assets/imgs/certs/Introduction to Cybersecurity.png?w=480;800;1200&format=webp&quality=78&as=img';
import certGestaoImg from '../assets/imgs/certs/Introdução à Gestão de Projetos.png?w=480;800;1200&format=webp&quality=78&as=img';
import certIotImg from '../assets/imgs/certs/Introduction to LOT.png?w=480;800;1200&format=webp&quality=78&as=img';
import certHardwareImg from '../assets/imgs/certs/Fundamentos de TI - Hardware e Software.png?w=480;800;1200&format=webp&quality=78&as=img';
import certRiwImg from '../assets/imgs/certs/Rio Innovation Week 2023.png?w=480;800;1200&format=webp&quality=78&as=img';

// imagetools' `as=img` gives { src, srcset, w, h }; srcset is missing when only one width survives the clamp.
const responsive = ({ src, srcset }) => ({ src, srcSet: srcset });

export const portrait = responsive(portraitImg);

export const cvModernPt = responsive(cvModernPtImg);
export const cvCorporatePt = responsive(cvCorporatePtImg);
export const cvModernEn = responsive(cvModernEnImg);
export const cvCorporateEn = responsive(cvCorporateEnImg);

export const nfse = responsive(nfseImg);
export const torresBurgers = responsive(torresBurgersImg);
export const forgeDevApps = responsive(forgeDevAppsImg);
export const costs = responsive(costsImg);
export const steakBurger = responsive(steakBurgerImg);

export const certJavaUdemy = responsive(certJavaUdemyImg);
export const certIotIaPucrs = responsive(certIotIaPucrsImg);
export const certScrum = responsive(certScrumImg);
export const certPoo = responsive(certPooImg);
export const certGit = responsive(certGitImg);
export const certDbAdmin = responsive(certDbAdminImg);
export const certImplDb = responsive(certImplDbImg);
export const certModeling = responsive(certModelingImg);
export const certSecurity = responsive(certSecurityImg);
export const certCyber = responsive(certCyberImg);
export const certGestao = responsive(certGestaoImg);
export const certIot = responsive(certIotImg);
export const certHardware = responsive(certHardwareImg);
export const certRiw = responsive(certRiwImg);
