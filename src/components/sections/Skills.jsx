import { useLanguage } from '../../context/LanguageContext';
import WakaTime from './WakaTime'; // Importando nosso novo componente!

export default function Skills() {
  const { t } = useLanguage();

  return (
    <section id="skills" className="py-20 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">
          <span className="border-b-4 border-primary pb-2">{t.skills.title}</span>
        </h2>

        {/* O Dashboard WakaTime entra aqui, dando um show antes das tecnologias */}
        <div className="mb-20">
          <WakaTime />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {t.skills.list.map((skill, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center justify-center p-6 bg-surface/40 backdrop-blur-sm rounded-xl border border-white/10 hover:border-primary/50 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(var(--primary-rgb),0.15)] transition-all duration-300 group"
            >
              <i className={`${skill.icon} text-5xl mb-4 text-gray-400 group-hover:text-white transition-colors duration-300`}></i>
              <span className="font-semibold text-gray-300 group-hover:text-primary transition-colors">{skill.name}</span>
            </div>
          ))}
        </div>
        
      </div>
    </section>
  );
}