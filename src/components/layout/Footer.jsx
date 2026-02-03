import { useLanguage } from '../../context/LanguageContext';
import { Icon } from '@iconify/react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer id="contact" className="bg-surface relative pt-20 pb-10 mt-20 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6 text-center">
        
        <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Vamos construir algo incrível?</h2>
            <p className="text-muted mb-8">Estou disponível para novos projetos e oportunidades como Full Stack.</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="mailto:felipetorresaraujo@gmail.com" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-bg font-bold rounded-full hover:bg-primary-600 transition-all hover:scale-105">
                    <Icon icon="solar:letter-bold" width="20" />
                    Mandar Email
                </a>
                
                <a href={t.hero.resumeLink} target="_blank" className="inline-flex items-center gap-2 px-8 py-3 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all hover:scale-105">
                    <Icon icon="solar:file-download-bold" width="20" />
                    {t.hero.ctaResume}
                </a>
            </div>
        </div>

        {/* Redes Sociais */}
        <div className="flex justify-center gap-8 mb-12">
            <a href="https://linkedin.com/in/felipe-torres-id" target="_blank" className="text-gray-400 hover:text-primary transition-colors hover:-translate-y-1 transform duration-300">
                <Icon icon="mdi:linkedin" width="36" />
            </a>
            <a href="https://github.com/fp-torres" target="_blank" className="text-gray-400 hover:text-primary transition-colors hover:-translate-y-1 transform duration-300">
                <Icon icon="mdi:github" width="36" />
            </a>
            <a href="https://instagram.com/fp.torresz" target="_blank" className="text-gray-400 hover:text-primary transition-colors hover:-translate-y-1 transform duration-300">
                <Icon icon="mdi:instagram" width="36" />
            </a>
             {/* WhatsApp */}
            <a href="https://wa.me/5521967600280" target="_blank" className="text-gray-400 hover:text-primary transition-colors hover:-translate-y-1 transform duration-300">
                <Icon icon="mdi:whatsapp" width="36" />
            </a>
        </div>

        <div className="pt-8 border-t border-white/5">
            <p className="text-sm text-gray-500">
                © 2026 Felipe Torres. Todos os direitos reservados.
            </p>
        </div>
      </div>
    </footer>
  );
}