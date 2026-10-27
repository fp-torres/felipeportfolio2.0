// Fills "{name}" placeholders of the i18n strings: fill('APOD · {date}', { date: '2026-10-26' }).
export const fill = (template, values) =>
  String(template ?? '').replace(/\{(\w+)\}/g, (match, key) => (values[key] ?? match).toString());

export const localeOf = (lang) => (lang === 'en' ? 'en-US' : 'pt-BR');
