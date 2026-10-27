import { useState } from 'react';
import { m as Motion } from 'framer-motion';
import { useLanguage } from '../../context/useLanguage';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { reveal } from '../../lib/motion';
import Section from '../ui/Section';
import SectionHeader from '../ui/SectionHeader';
import Sheet from '../ui/Sheet';
import CertificateCard from '../certificates/CertificateCard';
import CertificateDetail, { COMPACT_QUERY, CertificateVerifyLink } from '../certificates/CertificateDetail';
import CertificateGallery from '../certificates/CertificateGallery';

// Rendered width of one item in the "see all" grid (2 / 3 / 4 columns).
const GRID_SIZES = '(min-width: 1024px) 17rem, (min-width: 640px) 30vw, 46vw';

export default function Certificates() {
  const { t } = useLanguage();
  const items = t.certificates.items;
  const [gridOpen, setGridOpen] = useState(false);
  // Keep the id (not the object) so the open sheet follows a language switch.
  const [selectedId, setSelectedId] = useState(null);
  const selected = items.find((cert) => cert.id === selectedId) ?? null;
  // Short landscape screens: the "Verificar" button sits under the name instead of in a footer row.
  const compact = useMediaQuery(COMPACT_QUERY);
  const verifyFooter =
    selected?.credentialUrl && !compact ? <CertificateVerifyLink href={selected.credentialUrl} /> : undefined;

  return (
    // Size container: the gallery measures the band (100cqw) to bleed to the screen edges on wide screens.
    <Section id="certificates" band="elevated" labelledBy="certificates-title" className="[container-type:inline-size]">
      <SectionHeader
        id="certificates-title"
        eyebrow={t.certificates.eyebrow}
        title={t.certificates.title}
        action={{ label: t.certificates.seeAllCount.replace('{n}', items.length), onClick: () => setGridOpen(true) }}
      />

      <Motion.div {...reveal}>
        <CertificateGallery items={items} onSelect={setSelectedId} />
      </Motion.div>

      <Sheet open={gridOpen} onClose={() => setGridOpen(false)} title={t.certificates.gridTitle} size="xl">
        <ul role="list" className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4">
          {items.map((cert) => (
            <li key={cert.id}>
              <CertificateCard cert={cert} onSelect={setSelectedId} sizes={GRID_SIZES} />
            </li>
          ))}
        </ul>
      </Sheet>

      {/* Opens on top of the grid sheet when picked from there; Escape / close returns to it. */}
      <Sheet
        open={selected !== null}
        onClose={() => setSelectedId(null)}
        title={selected?.name}
        hideTitle
        size="lg"
        footer={verifyFooter}
      >
        {selected && <CertificateDetail cert={selected} compact={compact} />}
      </Sheet>
    </Section>
  );
}
