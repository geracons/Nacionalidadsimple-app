import { decodeHTML } from 'entities';

/** Decodifica entidades HTML (&#8220;, &amp;, &nbsp;…) que WordPress mete en títulos y extractos. */
export function decodeEntities(value: string): string {
  return decodeHTML(value);
}

/** Quita etiquetas HTML y normaliza espacios. */
export function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Limpia el extracto que genera WordPress ("[…]", "Leer más", etc.). */
export function cleanExcerpt(html: string): string {
  return stripTags(html)
    .replace(/\s*\[(…|&hellip;|\.\.\.)\]\s*$/u, '…')
    .replace(/\s*(Leer más|Seguir leyendo|Read more|Continue reading).*$/iu, '')
    .trim();
}

/** Minutos de lectura estimados (≈200 palabras por minuto). */
export function readingMinutes(html: string): number {
  const words = stripTags(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** "3 de mayo de 2025" — sin depender de Intl para que funcione igual en todos los motores JS. */
export function formatDate(date: Date): string {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}

/** "Hoy", "Ayer", "Hace 3 días" o la fecha completa si es más antigua. */
export function formatRelativeDate(date: Date, now: Date = new Date()): string {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days <= 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return formatDate(date);
}
