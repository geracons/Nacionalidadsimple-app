/**
 * Cliente de la API REST de WordPress (/wp-json/wp/v2).
 * Convierte las respuestas de WordPress a tipos simples que usan las pantallas.
 */

import { WP_URL } from '@/config';
import { cleanExcerpt, decodeEntities, readingMinutes } from '@/lib/text';

export type Category = {
  id: number;
  name: string;
  slug: string;
  count: number;
  parent: number;
  description: string;
};

export type FeaturedImage = {
  url: string;
  /** Versión más ligera para miniaturas. */
  thumbUrl: string;
  width?: number;
  height?: number;
  alt: string;
};

export type PostSummary = {
  id: number;
  type: 'post' | 'page';
  slug: string;
  link: string;
  /** Fecha ISO (string para que se pueda guardar en caché como JSON). */
  date: string;
  title: string;
  excerpt: string;
  image?: FeaturedImage;
  categories: Pick<Category, 'id' | 'name' | 'slug'>[];
  sticky: boolean;
};

export type Post = PostSummary & {
  /** HTML del contenido, tal cual lo devuelve WordPress. */
  html: string;
  /** ID de la imagen destacada (para no repetirla dentro del contenido). */
  featuredMediaId?: number;
  author?: string;
  readingMinutes: number;
};

export type PostsPage = {
  posts: PostSummary[];
  page: number;
  totalPages: number;
  total: number;
};

export class WpError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'WpError';
  }
}

// ----- Tipos crudos de la API (sólo los campos que usamos) -----

type Rendered = { rendered: string };

type RawMedia = {
  source_url?: string;
  alt_text?: string;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<string, { source_url: string; width: number; height: number }>;
  };
};

type RawTerm = { id: number; name: string; slug: string; taxonomy: string };

type RawPost = {
  id: number;
  type: string;
  slug: string;
  link: string;
  date: string;
  date_gmt?: string;
  title: Rendered;
  excerpt?: Rendered;
  content?: Rendered;
  sticky?: boolean;
  featured_media?: number;
  /** Datos SEO de Yoast: su meta descripción es mejor resumen que el extracto automático. */
  yoast_head_json?: { description?: string };
  _embedded?: {
    author?: { name?: string }[];
    'wp:featuredmedia'?: RawMedia[];
    'wp:term'?: RawTerm[][];
  };
};

type RawCategory = Category & { name: string; description: string };

// ----- Helpers -----

const API = `${WP_URL}/wp-json/wp/v2`;
const EMBED = 'author,wp:featuredmedia,wp:term';
const SUMMARY_FIELDS = [
  'id',
  'type',
  'slug',
  'link',
  'date',
  'date_gmt',
  'title',
  'excerpt',
  'sticky',
  'featured_media',
  'yoast_head_json.description',
  '_links',
  '_embedded',
];
const LIST_FIELDS = SUMMARY_FIELDS.join(',');
const DETAIL_FIELDS = [...SUMMARY_FIELDS, 'content'].join(',');
const HIDDEN_CATEGORY_SLUGS = new Set(['uncategorized', 'sin-categoria', 'sin-categorizar']);

type Query = Record<string, string | number | boolean | undefined>;

function buildUrl(path: string, query: Query): string {
  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return `${API}${path}${params ? `?${params}` : ''}`;
}

async function request<T>(path: string, query: Query = {}, signal?: AbortSignal) {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error;
    throw new WpError('No hay conexión. Revisa tu internet e inténtalo de nuevo.');
  }

  if (!response.ok) {
    throw new WpError(
      response.status >= 500
        ? 'La web no responde en este momento. Inténtalo en unos minutos.'
        : 'No se pudo cargar el contenido.',
      response.status
    );
  }

  const data = (await response.json()) as T;
  return {
    data,
    total: Number(response.headers.get('X-WP-Total') ?? 0),
    totalPages: Number(response.headers.get('X-WP-TotalPages') ?? 1),
  };
}

function parseDate(raw: RawPost): string {
  // date_gmt viene sin zona horaria; le añadimos la Z para interpretarla como UTC.
  if (raw.date_gmt) return new Date(`${raw.date_gmt}Z`).toISOString();
  return new Date(raw.date).toISOString();
}

function mapImage(media?: RawMedia): FeaturedImage | undefined {
  if (!media?.source_url) return undefined;
  const sizes = media.media_details?.sizes ?? {};
  const pick = (...names: string[]) => names.map((name) => sizes[name]).find(Boolean);
  const large = pick('large', 'medium_large', 'full');
  const thumb = pick('medium_large', 'medium', 'large');
  return {
    url: large?.source_url ?? media.source_url,
    thumbUrl: thumb?.source_url ?? media.source_url,
    width: large?.width ?? media.media_details?.width,
    height: large?.height ?? media.media_details?.height,
    alt: decodeEntities(media.alt_text ?? ''),
  };
}

function mapSummary(raw: RawPost): PostSummary {
  const terms = raw._embedded?.['wp:term']?.flat() ?? [];
  const title = decodeEntities(raw.title.rendered).trim();
  const seoDescription = decodeEntities(raw.yoast_head_json?.description ?? '').trim();
  return {
    id: raw.id,
    type: raw.type === 'page' ? 'page' : 'post',
    slug: raw.slug,
    link: raw.link,
    date: parseDate(raw),
    title,
    excerpt: seoDescription || cleanExcerpt(raw.excerpt?.rendered ?? '', title),
    image: mapImage(raw._embedded?.['wp:featuredmedia']?.[0]),
    categories: terms
      .filter((term) => term.taxonomy === 'category' && !HIDDEN_CATEGORY_SLUGS.has(term.slug))
      .map(({ id, name, slug }) => ({ id, name: decodeEntities(name), slug })),
    sticky: Boolean(raw.sticky),
  };
}

function mapPost(raw: RawPost): Post {
  const html = raw.content?.rendered ?? '';
  return {
    ...mapSummary(raw),
    html,
    featuredMediaId: raw.featured_media || undefined,
    author: raw._embedded?.author?.[0]?.name,
    readingMinutes: readingMinutes(html),
  };
}

// ----- API pública -----

export type ListPostsParams = {
  page?: number;
  perPage?: number;
  category?: number;
  search?: string;
};

export async function listPosts(
  { page = 1, perPage = 10, category, search }: ListPostsParams,
  signal?: AbortSignal
): Promise<PostsPage> {
  const { data, total, totalPages } = await request<RawPost[]>(
    '/posts',
    {
      _embed: EMBED,
      _fields: LIST_FIELDS,
      page,
      per_page: perPage,
      categories: category,
      search: search?.trim(),
    },
    signal
  );
  return { posts: data.map(mapSummary), page, total, totalPages };
}

/**
 * Busca una entrada por slug y, si no existe, una página.
 * Así los enlaces internos de la web se abren dentro de la app.
 */
export async function getContentBySlug(slug: string, signal?: AbortSignal): Promise<Post> {
  for (const path of ['/posts', '/pages']) {
    const { data } = await request<RawPost[]>(
      path,
      { slug, _embed: EMBED, _fields: DETAIL_FIELDS },
      signal
    );
    if (data.length > 0) return mapPost(data[0]);
  }
  throw new WpError('Este contenido ya no está disponible.', 404);
}

export async function listCategories(signal?: AbortSignal): Promise<Category[]> {
  const { data } = await request<RawCategory[]>(
    '/categories',
    {
      per_page: 100,
      hide_empty: true,
      orderby: 'count',
      order: 'desc',
      _fields: 'id,name,slug,count,parent,description',
    },
    signal
  );
  return data
    .filter((category) => !HIDDEN_CATEGORY_SLUGS.has(category.slug))
    .map((category) => ({
      ...category,
      name: decodeEntities(category.name),
      description: decodeEntities(category.description ?? ''),
    }));
}

/** Devuelve los segmentos de ruta si `url` pertenece a la propia web. */
function siteSegments(url: string): string[] | undefined {
  const match = url.match(/^https?:\/\/(?:www\.)?([^/?#]+)(\/[^?#]*)?/i);
  if (!match) return undefined;
  const siteHost = WP_URL.replace(/^https?:\/\/(?:www\.)?/i, '').split('/')[0];
  if (match[1].toLowerCase() !== siteHost.toLowerCase()) return undefined;
  return (match[2] ?? '')
    .split('/')
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
}

const RESERVED_SEGMENTS = new Set([
  'wp-content',
  'wp-admin',
  'wp-json',
  'feed',
  'tag',
  'author',
  'page',
  'category',
]);

/**
 * Si `url` apunta a una entrada/página de la propia web, devuelve su slug.
 * Ej.: https://nacionalidadsimple.com/2024/05/como-pedir-cita/ → "como-pedir-cita"
 */
export function internalSlugFromUrl(url: string): string | undefined {
  const segments = siteSegments(url);
  if (!segments?.length || RESERVED_SEGMENTS.has(segments[0])) return undefined;
  const slug = segments[segments.length - 1];
  // Archivos (pdf, jpg…) no son entradas.
  if (/\.[a-z0-9]{2,4}$/i.test(slug)) return undefined;
  return slug;
}

/** Si `url` es un archivo de categoría de la web (/category/slug/), devuelve el slug. */
export function categorySlugFromUrl(url: string): string | undefined {
  const segments = siteSegments(url);
  if (segments?.[0] !== 'category' || segments.length < 2) return undefined;
  return segments[segments.length - 1];
}
