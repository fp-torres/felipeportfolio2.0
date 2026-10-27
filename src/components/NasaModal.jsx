import { useLanguage } from '../context/useLanguage';
import { useApod } from '../hooks/useApod';
import ApodView from './lab/ApodView';

// Laboratório → "NASA hoje": today's Astronomy Picture of the Day (via /nasa.php).
// Lazy-loaded by the Footer and rendered inside its <Sheet>, so it only mounts while the sheet is open.
export default function NasaModal() {
  const { lang } = useLanguage();
  const apod = useApod({ lang });

  // relative: keeps the screen-reader-only texts (absolute) inside the sheet's scrolling body, so they never make
  // the sheet panel itself scrollable (see NasaTimeMachine).
  return (
    <div className="relative">
      <ApodView resource={apod} />
    </div>
  );
}
