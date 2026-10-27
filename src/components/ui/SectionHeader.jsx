// Section header: optional path-style eyebrow (~/projetos), the section H2 and a short lede.
// action = { label, href } | { label, onClick }; external links get ↗, internal ones ›.
export default function SectionHeader({ id, eyebrow, title, lede, action, align = 'left', className = '' }) {
  const centered = align === 'center';

  return (
    <header
      className={`section-head flex flex-col gap-4 ${
        centered ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between'
      } ${className}`}
    >
      <div className={centered ? 'mx-auto max-w-3xl' : 'max-w-3xl'}>
        {eyebrow && <p className="eyebrow mb-2">~/{eyebrow}</p>}
        <h2 id={id} className="headline">
          {title}
        </h2>
        {lede && <p className={`lede ${centered ? 'mx-auto' : ''}`}>{lede}</p>}
      </div>
      {action && <SectionAction {...action} />}
    </header>
  );
}

function SectionAction({ label, href, onClick, external = false }) {
  const arrow = (
    <span aria-hidden="true" className="text-[1.1em] leading-none">
      {external ? '↗' : '›'}
    </span>
  );

  if (href) {
    return (
      <a
        href={href}
        className="text-link shrink-0"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {label}
        {arrow}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className="text-link shrink-0 self-start md:self-auto">
      {label}
      {arrow}
    </button>
  );
}
