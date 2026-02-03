import { useLanguage } from '../../context/LanguageContext';

export default function Skills() {
  const { t } = useLanguage();

  return (
    <section id="skills" className="py-20 bg-black/20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          <span className="border-b-4 border-primary pb-2">{t.skills.title}</span>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {t.skills.list.map((skill, index) => (
            <div key={index} className="flex flex-col items-center justify-center p-6 bg-surface rounded-xl border border-white/5 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 group">
              <i className={`${skill.icon} text-5xl mb-4 text-gray-400 group-hover:text-white transition-colors duration-300`}></i>
              <span className="font-semibold text-muted group-hover:text-primary transition-colors">{skill.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}