// Full-width band + the page's single container. band="elevated" = bg-surface-1 (cards inside use surface-2).
export default function Section({ id, band = 'default', labelledBy, className = '', containerClassName = '', children }) {
  const bandClass = band === 'elevated' ? 'bg-surface-1' : '';

  return (
    <section id={id} aria-labelledby={labelledBy} className={`section ${bandClass} ${className}`}>
      <div className={`container-page ${containerClassName}`}>{children}</div>
    </section>
  );
}
