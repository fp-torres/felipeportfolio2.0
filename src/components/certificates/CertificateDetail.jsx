import { useLanguage } from '../../context/useLanguage';
import { CertificateStage } from './CertificateCard';

// Phones on their side: the sheet is only ~300px tall. Image and data sit side by side, the image stays in
// view (sticky, sized to the sheet) and the "Verificar" button moves up next to the name instead of taking a
// fixed footer row. Certificates.jsx reads the same query to decide where the button goes.
export const COMPACT_QUERY = '(orientation: landscape) and (max-height: 540px)';

const DETAIL_SIZES = '(orientation: landscape) and (max-height: 540px) 50vw, (min-width: 640px) 52rem, 100vw';
const DETAIL_FIELDS = ['instructor', 'issued', 'duration', 'credentialId', 'reference'];

// Body of the certificate sheet: the paper on a stage, name + issuer, then the credential data as rows.
// Image and information sit side by side on short landscape screens and, when there is credential data to
// show, on desktop; otherwise the paper gets the full width.
export default function CertificateDetail({ cert, compact = false }) {
  const { t } = useLanguage();
  const rows = DETAIL_FIELDS.filter((key) => cert[key]).map((key) => [key, cert[key]]);
  const desktopSplit = rows.length > 0 ? 'lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-8' : '';

  return (
    <div
      className={`grid gap-5 [@media(orientation:landscape)_and_(max-height:540px)]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] [@media(orientation:landscape)_and_(max-height:540px)]:items-start [@media(orientation:landscape)_and_(max-height:540px)]:gap-6 ${desktopSplit}`}
    >
      <CertificateStage
        cert={cert}
        alt={cert.name}
        sizes={DETAIL_SIZES}
        eager
        className="aspect-[4/3] max-h-[50dvh] w-full [@media(orientation:landscape)_and_(max-height:540px)]:sticky [@media(orientation:landscape)_and_(max-height:540px)]:top-0 [@media(orientation:landscape)_and_(max-height:540px)]:max-h-[calc(100dvh-10rem)]"
        insetClassName="inset-4 sm:inset-6"
      />

      <div className="min-w-0">
        {/* Visible title only: the dialog is already named by the (visually hidden) sheet title. */}
        <p aria-hidden="true" className="text-title-2 text-label-1">
          {cert.name}
        </p>
        <p className="mt-1 text-callout text-label-2">{cert.issuer}</p>

        {compact && cert.credentialUrl && <CertificateVerifyLink href={cert.credentialUrl} inline />}

        {rows.length > 0 && (
          <dl className="mt-5 divide-y divide-separator/10 rounded-tile bg-surface-2 px-4">
            {rows.map(([key, value]) =>
              key === 'credentialId' ? (
                <div key={key} className="py-3">
                  <dt className="text-callout text-label-2">{t.certificates.credentialLabels[key]}</dt>
                  {/* Breaks after a hyphen first ("…-46f6-" / "a734-…"), mid-token only if it must. */}
                  <dd className="mt-0.5 font-mono text-subhead text-label-1 [overflow-wrap:anywhere]">{value}</dd>
                </div>
              ) : (
                <div key={key} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="shrink-0 text-callout text-label-2">{t.certificates.credentialLabels[key]}</dt>
                  <dd className="min-w-0 text-right text-callout tabular-nums text-label-1">{value}</dd>
                </div>
              ),
            )}
          </dl>
        )}
      </div>
    </div>
  );
}

// The one primary action: in the sheet footer (always visible below the scrolling body), or inline under the
// name on short landscape screens.
export function CertificateVerifyLink({ href, inline = false }) {
  const { t } = useLanguage();

  const link = (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-primary ${inline ? 'mt-4' : 'w-full sm:w-auto'}`}
    >
      {t.certificates.credentialLabels.verify}
      <span aria-hidden="true" className="text-[1.1em] leading-none">
        ↗
      </span>
      <span className="sr-only">({t.ui.opensInNewTab})</span>
    </a>
  );

  return inline ? link : <div className="flex sm:justify-end">{link}</div>;
}
