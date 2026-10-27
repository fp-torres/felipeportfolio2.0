import { useEffect, useState } from 'react';

// Content-box size of an element, kept up to date with a ResizeObserver (rotation, sheet resize…).
// Returns [ref, size]: pass `ref` as the element's ref (it follows the element if it is swapped).
// size is { width: 0, height: 0 } until the first measurement (and on the server).
export function useElementSize() {
  const [element, setElement] = useState(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!element) return undefined;

    const update = (width, height) => {
      const next = { width: Math.floor(width), height: Math.floor(height) };
      setSize((previous) => (previous.width === next.width && previous.height === next.height ? previous : next));
    };

    if (typeof ResizeObserver === 'undefined') {
      const measure = () => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        update(
          rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
          rect.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
        );
      };
      const frame = requestAnimationFrame(measure);
      window.addEventListener('resize', measure);
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', measure);
      };
    }

    const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width, entry.contentRect.height));
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return [setElement, size];
}
