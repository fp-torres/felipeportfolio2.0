import { useEffect, useState } from 'react';

// True once the element gets within `rootMargin` of the viewport (and stays true). Used to start
// fetching below-the-fold data only when the visitor is about to see it — saves requests on phones.
export function useNearViewport(ref, rootMargin = '600px') {
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (near || !element) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      // Very old browsers: just load on the next frame.
      const frame = requestAnimationFrame(() => setNear(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rootMargin, near]);

  return near;
}
