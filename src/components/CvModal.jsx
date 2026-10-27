import { useId } from 'react';
import { Icon } from '@iconify/react';
import { useLanguage } from '../context/useLanguage';
import { useMediaQuery } from '../hooks/useMediaQuery';
import Sheet from './ui/Sheet';

const FORMATS = ['modern', 'corporate'];

// Large paper previews only where they fit without scrolling; phones (and phones in landscape) get compact rows.
const ROOMY_QUERY = '(min-width: 640px) and (min-height: 501px)';

// Opened from the hero's "Baixar CV" and, through the 'open-cv' window event, from the footer.
export default function CvModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const roomy = useMediaQuery(ROOMY_QUERY);
  const copy = t.cvModal;

  return (
    <Sheet open={isOpen} onClose={onClose} title={copy.title} size="lg">
      <p className="max-w-reading text-callout text-label-2">{copy.subtitle}</p>

      <ul role="list" className={`mt-5 grid gap-3 sm:grid-cols-2 ${roomy ? 'sm:mt-6 sm:gap-grid' : ''}`}>
        {FORMATS.map((key) => (
          <li key={key} className="min-w-0">
            <CvFormat format={copy[key]} cta={copy.download} roomy={roomy} />
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

function CvFormat({ format, cta, roomy }) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;
  const ctaId = `${id}-cta`;

  const link = {
    href: format.link,
    download: format.fileName,
    target: '_blank',
    rel: 'noreferrer',
    'aria-labelledby': `${titleId} ${ctaId}`,
    'aria-describedby': descId,
  };

  const pill = (
    <>
      <Icon icon="solar:download-minimalistic-linear" className="size-4 shrink-0" aria-hidden="true" />
      {cta}
    </>
  );

  if (!roomy) {
    return (
      <a
        {...link}
        className="group flex h-full items-start gap-4 rounded-tile bg-surface-2 p-2 pr-4 transition-[background-color,transform] duration-fast ease-standard hover:bg-surface-3 active:scale-[0.985] active:bg-surface-3"
      >
        <img
          src={format.image}
          srcSet={format.imageSrcSet}
          sizes={format.imageSrcSet ? '72px' : undefined}
          alt=""
          width={72}
          height={100}
          decoding="async"
          className="h-[100px] w-[72px] shrink-0 rounded-[8px] bg-white object-cover object-top"
        />
        <div className="flex min-w-0 flex-1 flex-col items-start py-1.5">
          <h3 id={titleId} className="text-callout font-semibold text-label-1">
            {format.title}
          </h3>
          <p id={descId} className="mt-0.5 text-subhead text-label-2">
            {format.desc}
          </p>
          <span id={ctaId} className="btn-tinted btn-sm mt-3 group-hover:bg-primary/25">
            {pill}
          </span>
        </div>
      </a>
    );
  }

  return (
    <a
      {...link}
      className="group flex h-full flex-col items-center rounded-card bg-surface-2 p-5 text-center transition-[background-color,transform] duration-fast ease-standard hover:bg-surface-3 active:scale-[0.985] active:bg-surface-3 sm:p-6"
    >
      <img
        src={format.image}
        srcSet={format.imageSrcSet}
        sizes={format.imageSrcSet ? '226px' : undefined}
        alt=""
        width={1414}
        height={2000}
        decoding="async"
        className="aspect-[707/1000] h-[min(30vh,20rem)] w-auto max-w-full rounded-[6px] bg-white object-cover object-top shadow-paper"
      />
      <h3 id={titleId} className="mt-5 text-title-3 text-label-1">
        {format.title}
      </h3>
      <p id={descId} className="mt-1.5 max-w-[24rem] text-callout text-label-2">
        {format.desc}
      </p>
      <div className="mt-auto pt-5">
        <span id={ctaId} className="btn-tinted group-hover:bg-primary/25">
          {pill}
        </span>
      </div>
    </a>
  );
}
