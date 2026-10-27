// The certificate as a sheet of paper on a stage: always the whole document (contain), at full opacity.
// The image box fills the stage's inset area, so it has a size before the file arrives (a 0×0 lazy image
// peeking at the edge of the gallery would never load); the shadow is a drop-shadow (same values as
// shadow-paper) because it follows the painted paper, not the letterboxed box.
export function CertificateStage({ cert, alt = '', sizes, eager = false, className = '', insetClassName = 'inset-3' }) {
  return (
    <div className={`relative overflow-hidden rounded-tile bg-surface-2 ${className}`}>
      <div className={`absolute ${insetClassName}`}>
        <img
          src={cert.image}
          srcSet={cert.imageSrcSet || undefined}
          sizes={cert.imageSrcSet ? sizes : undefined}
          width={cert.imageWidth || 1400}
          height={cert.imageHeight || 1000}
          alt={alt}
          loading={eager ? undefined : 'lazy'}
          decoding="async"
          draggable="false"
          className="h-full w-full select-none object-contain drop-shadow-[0_6px_20px_rgb(0_0_0/0.45)]"
        />
      </div>
    </div>
  );
}

// Gallery / grid item: the whole tile is one button (title + issuer give it its accessible name).
export default function CertificateCard({ cert, onSelect, sizes }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(cert.id)}
      className="group block w-full rounded-tile text-left transition-transform duration-fast ease-standard active:scale-[0.98]"
    >
      <CertificateStage
        cert={cert}
        sizes={sizes}
        className="aspect-[4/3] transition-colors duration-base ease-standard group-hover:bg-surface-3"
      />
      <span className="mt-3 line-clamp-2 text-callout font-semibold text-label-1">{cert.name}</span>
      <span className="mt-0.5 block text-footnote text-label-2">{cert.issuer}</span>
    </button>
  );
}
