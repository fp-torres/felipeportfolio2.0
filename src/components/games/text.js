// Fills "{name}" placeholders: fill('Fase {n}', { n: 3 }) → 'Fase 3'. Unknown placeholders are left as is.
export function fill(template, values = {}) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (match, key) => (key in values ? String(values[key]) : match));
}

// forms = { one, other } (or a plain string). One rule works for both pt and en: 1 → one, anything else → other.
export function plural(forms, n, values = {}) {
  const template = typeof forms === 'string' ? forms : n === 1 ? forms?.one : forms?.other;
  return fill(template, { n, ...values });
}

export function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
