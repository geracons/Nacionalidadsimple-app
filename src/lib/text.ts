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

/** Textos de cabeceras/índices que se cuelan en el extracto automático (p. ej. con Elementor). */
const EXCERPT_NOISE = [/(^|\s)Poner categor[ií]a(?=\s|$)/giu, /(^|\s)(Tabla de contenidos?|Índice)(?=\s|$)/gu];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Limpia el extracto que genera WordPress: "[…]", "Leer más", el título repetido
 * de la cabecera y textos de índices.
 */
export function cleanExcerpt(html: string, title?: string): string {
  let text = stripTags(html)
    .replace(/\s*\[(…|&hellip;|\.\.\.)\]\s*$/u, '…')
    .replace(/\s*(Leer más|Seguir leyendo|Read more|Continue reading).*$/iu, '');
  for (const noise of EXCERPT_NOISE) text = text.replace(noise, ' ');
  if (title) text = text.replace(new RegExp(escapeRegExp(title), 'giu'), ' ');
  return removeRepeatedRun(text.split(/\s+/).filter(Boolean)).join(' ');
}

/**
 * Quita una frase repetida dos veces seguidas al principio del texto
 * (p. ej. el título de la cabecera de escritorio y el de móvil).
 */
function removeRepeatedRun(words: string[]): string[] {
  for (let start = 0; start < Math.min(words.length, 30); start++) {
    const maxLength = Math.min(30, Math.floor((words.length - start) / 2));
    for (let length = maxLength; length >= 4; length--) {
      let same = true;
      for (let k = 0; k < length && same; k++) {
        same = words[start + k] === words[start + length + k];
      }
      if (same) return [...words.slice(0, start + length), ...words.slice(start + length * 2)];
    }
  }
  return words;
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
