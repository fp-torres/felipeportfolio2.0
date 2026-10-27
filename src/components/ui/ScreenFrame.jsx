// Project media on a graphite 16:10 stage: the screenshot sits on an inner "screen" with a hairline ring and a
// soft frame shadow, cropped from the top. contain = logos/marks (e.g. the NFS-e logo) shown whole on a light
// neutral screen. Inside a card leave the figure square and let the card's overflow-hidden round it.
// position: crop anchor for screenshots wider than the screen (e.g. 'top-left' keeps a logo in the corner).
const POSITION = {
  top: 'object-top',
  'top-left': 'object-left-top',
  'top-right': 'object-right-top',
  center: 'object-center',
};

export default function ScreenFrame({
  src,
  srcSet,
  sizes,
  alt = '',
  width = 1600,
  height = 1000,
  contain = false,
  position = 'top',
  loading = 'lazy',
  className = '',
}) {
  const fit = contain ? 'object-contain p-[9%]' : `object-cover ${POSITION[position] ?? POSITION.top}`;

  return (
    <figure
      className={`relative aspect-[16/10] overflow-hidden bg-[radial-gradient(120%_90%_at_50%_0%,#2c2c2e_0%,#1c1c1e_55%,#141416_100%)] p-[6%] ${className}`}
    >
      <div
        className={`h-full overflow-hidden rounded-control shadow-frame ring-1 ring-white/10 ${
          contain ? 'bg-label-1' : 'bg-surface-2'
        }`}
      >
        {src && (
          <img
            src={src}
            srcSet={srcSet || undefined}
            sizes={srcSet ? sizes : undefined}
            alt={alt}
            width={width}
            height={height}
            loading={loading}
            decoding="async"
            className={`h-full w-full ${fit} transition-transform duration-slower ease-emphasized group-hover:scale-[1.02]`}
          />
        )}
      </div>
    </figure>
  );
}
