import { useLanguage } from '../../context/useLanguage';
import { Icon } from '@iconify/react';

export default function Projects() {
  const { lang, t } = useLanguage();
  const isPt = lang === 'pt';

  return (
    <section id="projects" className="py-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
        <span className="border-b-4 border-primary pb-2">{t.projects.title}</span>
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {t.projects.items.map((project) => (
          <div key={project.id} className="bg-surface rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-300 flex flex-col h-full shadow-lg">
            
            {/* Imagem */}
            <div className="relative h-48 overflow-hidden group">
              <img 
                src={project.image} 
                alt={project.title} 
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center gap-4">
                 {/* Links Hover */}
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

            {/* Conteúdo */}
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

              {/* Botões Mobile (para facilitar acesso sem hover) */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 md:hidden">
                 {project.github && project.github !== '#' && <a href={project.github} target="_blank" rel="noreferrer" className="text-primary text-sm font-bold flex items-center gap-1">{isPt ? 'Código' : 'Code'} <Icon icon="solar:code-circle-linear" /></a>}
                 {project.link && <a href={project.link} target="_blank" rel="noreferrer" className="text-primary text-sm font-bold flex items-center gap-1">{isPt ? 'Visitar' : 'Visit'} <Icon icon="solar:arrow-right-up-linear" /></a>}
                 {project.video && <a href={project.video} target="_blank" rel="noreferrer" className="text-primary text-sm font-bold flex items-center gap-1">{isPt ? 'Vídeo' : 'Video'} <Icon icon="solar:play-circle-linear" /></a>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
