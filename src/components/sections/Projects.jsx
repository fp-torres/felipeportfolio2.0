import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/useLanguage';
import { Icon } from '@iconify/react';

export default function Projects() {
  const { lang, t } = useLanguage();
  const isPt = lang === 'pt';
  const [selectedProject, setSelectedProject] = useState(null);

  // Trava o scroll da página quando o modal está aberto
  useEffect(() => {
    if (selectedProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [selectedProject]);

  return (
    <section id="projects" className="py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
        <span className="border-b-4 border-primary pb-2">{t.projects.title}</span>
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {t.projects.items.map((project) => (
          <div key={project.id} className="bg-surface rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-300 flex flex-col h-full shadow-lg">
            
            {/* Imagem do Card */}
            <div className="relative h-48 overflow-hidden group bg-white/5">
              <img 
                src={project.image} 
                alt={project.title} 
                loading="lazy"
                decoding="async"
                // Se o projeto tiver 'containImage', não corta a logo. Se não tiver, usa cover padrão.
                className={`w-full h-full ${project.containImage ? 'object-contain p-6' : 'object-cover'} transition-transform duration-700 group-hover:scale-110`}
              />
              <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center gap-4">
                 
                 {/* NOVO: Botão de Detalhes (Visível apenas se o projeto tiver a prop 'details') */}
                 {project.details && (
                    <button onClick={() => setSelectedProject(project)} className="p-3 bg-white text-bg rounded-full hover:bg-primary transition-colors cursor-pointer" title={isPt ? 'Ler Detalhes Técnicos' : 'Read Technical Details'} aria-label="Details">
                       <Icon icon="solar:document-text-bold" width="24" />
                    </button>
                 )}

                 {/* Links antigos mantidos */}
                 {project.github && project.github !== "#" && (
                    <a href={project.github} target="_blank" rel="noreferrer" className="p-3 bg-white text-bg rounded-full hover:bg-primary transition-colors" title={isPt ? 'Ver código' : 'View code'} aria-label={`${isPt ? 'Ver código de' : 'View code for'} ${project.title}`}>
                       <Icon icon="solar:code-circle-bold" width="24" />
                    </a>
                 )}
                 {project.link && (
                    <a href={project.link} target="_blank" rel="noreferrer" className="p-3 bg-white text-bg rounded-full hover:bg-primary transition-colors" title={isPt ? 'Abrir site' : 'Open website'} aria-label={`${isPt ? 'Abrir site de' : 'Open website for'} ${project.title}`}>
                       <Icon icon="solar:link-circle-bold" width="24" />
                    </a>
                 )}
                 {project.video && (
                    <a href={project.video} target="_blank" rel="noreferrer" className="p-3 bg-white text-bg rounded-full hover:bg-primary transition-colors" title={isPt ? 'Ver demonstração' : 'Watch demo'} aria-label={`${isPt ? 'Ver demonstração de' : 'Watch demo for'} ${project.title}`}>
                       <Icon icon="solar:play-circle-bold" width="24" />
                    </a>
                 )}
              </div>
            </div>

            {/* Conteúdo do Card */}
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
              <p className="text-muted text-sm mb-6 flex-grow leading-relaxed">{project.description}</p>
              
              <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-white/5 mb-4">
                {project.techs.map((tech, index) => (
                    <span key={`${project.id}-${tech}-${index}`} className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-md">
                    {tech}
                  </span>
                ))}
              </div>

              {/* Botões Mobile */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 md:hidden">
                 {project.details && (
                    <button onClick={() => setSelectedProject(project)} className="text-primary text-sm font-bold flex items-center gap-1 cursor-pointer">
                      {isPt ? 'Detalhes' : 'Details'} <Icon icon="solar:document-text-linear" />
                    </button>
                 )}
                 {project.github && project.github !== '#' && <a href={project.github} target="_blank" rel="noreferrer" className="text-primary text-sm font-bold flex items-center gap-1">{isPt ? 'Código' : 'Code'} <Icon icon="solar:code-circle-linear" /></a>}
                 {project.link && <a href={project.link} target="_blank" rel="noreferrer" className="text-primary text-sm font-bold flex items-center gap-1">{isPt ? 'Visitar' : 'Visit'} <Icon icon="solar:arrow-right-up-linear" /></a>}
                 {project.video && <a href={project.video} target="_blank" rel="noreferrer" className="text-primary text-sm font-bold flex items-center gap-1">{isPt ? 'Vídeo' : 'Video'} <Icon icon="solar:play-circle-linear" /></a>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* NOVO: MODAL DE DETALHES TÉCNICOS */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/90 backdrop-blur-sm" onClick={() => setSelectedProject(null)}>
          <div 
            className="bg-surface border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar Modal */}
            <button 
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-primary/20 text-white hover:text-primary rounded-full transition-colors z-10"
            >
              <Icon icon="solar:close-circle-bold" width="24" />
            </button>

            {/* Banner Modal */}
            <div className="w-full h-40 md:h-56 bg-white/5 flex items-center justify-center border-b border-white/5 relative">
               <img 
                  src={selectedProject.image} 
                  alt={selectedProject.title} 
                  className={`w-full h-full ${selectedProject.containImage ? 'object-contain p-8' : 'object-cover'}`}
               />
            </div>

            {/* Conteúdo Textual do Modal */}
            <div className="p-6 md:p-8">
              <h3 className="text-2xl font-bold text-white mb-6">{selectedProject.title}</h3>
              
              {/* O split('\n\n') converte quebras de linha do banco de dados em parágrafos separados */}
              <div className="text-muted text-sm md:text-base leading-relaxed space-y-4 mb-8">
                {selectedProject.details.split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              <div>
                <h4 className="text-white font-semibold mb-3">{isPt ? 'Tecnologias Utilizadas' : 'Tech Stack'}</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.techs.map((tech, index) => (
                      <span key={`modal-${selectedProject.id}-${tech}-${index}`} className="text-xs font-medium px-3 py-1.5 bg-primary/10 text-primary rounded-md border border-primary/20">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}