import { useLanguage } from '../../context/useLanguage';

// Loading placeholders with the same shapes as the real Laboratório content (no layout jump when it arrives).
// Shared by the Footer (while a lab chunk downloads) and by the sheets themselves (while data loads).

function LoadingLabel() {
  const { t } = useLanguage();
  return (
    <p role="status" className="sr-only">
      {t.ui.loading}
    </p>
  );
}

export function ApodSkeleton() {
  return (
    <div>
      <LoadingLabel />
      <div aria-hidden="true">
        <div className="skeleton aspect-[4/3] max-h-[min(60dvh,34rem)] w-full sm:aspect-[16/10] [@media(max-height:500px)]:max-h-[45dvh]" />
        <div className="max-w-reading">
          <div className="skeleton mt-5 h-4 w-36 rounded-pill" />
          <div className="skeleton mt-3 h-7 w-4/5 rounded-pill" />
          <div className="skeleton mt-3 h-4 w-44 rounded-pill" />
          <div className="mt-5 space-y-3">
            <div className="skeleton h-4 w-full rounded-pill" />
            <div className="skeleton h-4 w-full rounded-pill" />
            <div className="skeleton h-4 w-11/12 rounded-pill" />
            <div className="skeleton h-4 w-2/3 rounded-pill" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function NewsSkeleton() {
  return (
    <div>
      <LoadingLabel />
      <div aria-hidden="true" className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="skeleton h-36" />
        ))}
      </div>
    </div>
  );
}

export function TravelSkeleton() {
  return (
    <div>
      <LoadingLabel />
      <div aria-hidden="true" className="max-w-reading">
        <div className="skeleton h-4 w-full rounded-pill" />
        <div className="skeleton mt-3 h-4 w-3/4 rounded-pill" />
        <div className="skeleton mt-7 h-4 w-12 rounded-pill" />
        <div className="mt-2 flex flex-col gap-3 sm:max-w-[30rem] sm:flex-row">
          <div className="skeleton h-12 flex-1 rounded-control" />
          <div className="skeleton h-12 w-full rounded-pill sm:w-40" />
        </div>
      </div>
    </div>
  );
}
