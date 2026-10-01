/**
 * Convierte el HTML de WordPress en un árbol simple que el renderizador nativo recorre.
 * Aquí no hay nada de React Native, así que se puede probar con Node.
 */
import { Parser } from 'htmlparser2';

export type HtmlText = { type: 'text'; data: string };
export type HtmlElement = {
  type: 'element';
  name: string;
  attribs: Record<string, string>;
  children: HtmlNode[];
};
export type HtmlNode = HtmlText | HtmlElement;

/** Etiquetas que nunca se muestran. */
const IGNORED_TAGS = new Set([
  'script',
  'style',
  'noscript',
  'template',
  'svg',
  'form',
  'input',
  'button',
  'select',
  'textarea',
  'link',
  'meta',
  'head',
  'ins',
]);

/** Clases de plugins (anuncios, compartir, índices automáticos…) que no tienen sentido en la app. */
const IGNORED_CLASSES = [
  'screen-reader-text',
  'sharedaddy',
  'sd-sharing',
  'jp-relatedposts',
  'adsbygoogle',
  'ez-toc-container',
  'ez-toc-v2_0',
  'lwptoc',
  'toc_container',
  'wp-block-rank-math-toc-block',
  'wp-block-yoast-seo-table-of-contents',
  'heateor_sss',
  'addtoany_share',
  'social-share',
  'wpcf7',
  'post-views',
  // Elementor: lo que está oculto en móvil y el índice (se genera con JS en el navegador).
  'elementor-hidden-mobile',
  'elementor-hidden-phone',
  'elementor-widget-table-of-contents',
  'elementor-toc',
];

function isIgnored(name: string, attribs: Record<string, string>) {
  if (IGNORED_TAGS.has(name)) return true;
  const className = attribs.class ?? '';
  if (!className && !attribs.id) return false;
  const haystack = `${className} ${attribs.id ?? ''}`;
  return IGNORED_CLASSES.some((ignored) => haystack.includes(ignored));
}

export function parseHtml(html: string): HtmlNode[] {
  const root: HtmlElement = { type: 'element', name: 'root', attribs: {}, children: [] };
  const stack: HtmlElement[] = [root];
  // Profundidad dentro de un elemento ignorado: mientras sea > 0 se descarta todo.
  let ignoredDepth = 0;

  const parser = new Parser(
    {
      onopentag(name, attribs) {
        if (ignoredDepth > 0 || isIgnored(name, attribs)) {
          ignoredDepth++;
          return;
        }
        const element: HtmlElement = { type: 'element', name, attribs, children: [] };
        stack[stack.length - 1].children.push(element);
        stack.push(element);
      },
      ontext(data) {
        if (ignoredDepth > 0) return;
        const parent = stack[stack.length - 1];
        const last = parent.children[parent.children.length - 1];
        if (last?.type === 'text') last.data += data;
        else parent.children.push({ type: 'text', data });
      },
      onclosetag() {
        if (ignoredDepth > 0) {
          ignoredDepth--;
          return;
        }
        if (stack.length > 1) stack.pop();
      },
    },
    { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true }
  );
  parser.write(html);
  parser.end();
  return root.children;
}

export function hasClass(node: HtmlElement, className: string) {
  return (node.attribs.class ?? '').split(/\s+/).includes(className);
}

export function classIncludes(node: HtmlElement, fragment: string) {
  return (node.attribs.class ?? '').includes(fragment);
}

/** Texto plano de un nodo (para alt, captions, títulos de tarjetas…). */
export function textContent(node: HtmlNode): string {
  if (node.type === 'text') return node.data;
  return node.children.map(textContent).join('');
}

export function findFirst(
  nodes: HtmlNode[],
  predicate: (node: HtmlElement) => boolean
): HtmlElement | undefined {
  for (const node of nodes) {
    if (node.type !== 'element') continue;
    if (predicate(node)) return node;
    const found = findFirst(node.children, predicate);
    if (found) return found;
  }
  return undefined;
}

/** Extrae el ID de un vídeo de YouTube de una URL de embed, watch o youtu.be. */
export function youtubeId(url: string): string | undefined {
  const match = url.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?(?:.*&)?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/i
  );
  return match?.[1];
}

/**
 * Normaliza los espacios de una secuencia de nodos en línea igual que un navegador:
 * colapsa espacios, elimina los del principio/final y los duplicados entre etiquetas.
 * Devuelve el texto final de cada nodo de texto.
 */
export function normalizeInlineWhitespace(nodes: HtmlNode[]): Map<HtmlText, string> {
  const leaves: (HtmlText | 'br')[] = [];
  const walk = (list: HtmlNode[]) => {
    for (const node of list) {
      if (node.type === 'text') leaves.push(node);
      else if (node.name === 'br') leaves.push('br');
      else walk(node.children);
    }
  };
  walk(nodes);

  const result = new Map<HtmlText, string>();
  // true cuando lo último que se emitió fue un espacio o el inicio de línea.
  let atBoundary = true;
  let lastText: HtmlText | undefined;

  for (const leaf of leaves) {
    if (leaf === 'br') {
      if (lastText) result.set(lastText, result.get(lastText)!.replace(/ $/, ''));
      atBoundary = true;
      continue;
    }
    let text = leaf.data.replace(/[\t\n\r\f ]+/g, ' ');
    if (atBoundary) text = text.replace(/^ /, '');
    result.set(leaf, text);
    if (text.length > 0) {
      atBoundary = text.endsWith(' ');
      lastText = leaf;
    }
  }
  if (lastText) result.set(lastText, result.get(lastText)!.replace(/ $/, ''));
  return result;
}

/** Etiquetas que se conservan aunque no tengan texto (imágenes, celdas de tabla…). */
const KEEP_WHEN_EMPTY = new Set([
  'img',
  'picture',
  'source',
  'video',
  'iframe',
  'embed',
  'object',
  'hr',
  'br',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
]);
/** Etiquetas que cuentan como contenido aunque no tengan texto. */
const MEDIA_TAGS = new Set(['img', 'picture', 'video', 'iframe', 'embed', 'object', 'hr', 'table']);

export type CleanOptions = {
  /** ID de la imagen destacada: la app ya la muestra arriba, así que no se repite. */
  featuredMediaId?: number;
};

/**
 * Limpia el contenido para la app:
 * - quita los <h1> (la app ya muestra el título del artículo),
 * - quita la imagen destacada repetida dentro del contenido (cabeceras de Elementor),
 * - quita párrafos, títulos y contenedores vacíos (los "&nbsp;" que se usan como separador).
 */
export function cleanContent(nodes: HtmlNode[], options: CleanOptions = {}): HtmlNode[] {
  const featuredClass = options.featuredMediaId ? `wp-image-${options.featuredMediaId}` : undefined;
  const clean = (list: HtmlNode[]): HtmlNode[] => {
    const output: HtmlNode[] = [];
    for (const node of list) {
      if (node.type === 'text') {
        output.push(node);
        continue;
      }
      if (node.name === 'h1') continue;
      if (node.name === 'img' && featuredClass && hasClass(node, featuredClass)) continue;
      const element: HtmlElement = { ...node, children: clean(node.children) };
      if (!KEEP_WHEN_EMPTY.has(element.name) && isEmptyElement(element)) continue;
      output.push(element);
    }
    return output;
  };
  return clean(nodes);
}

function isEmptyElement(node: HtmlElement): boolean {
  // trim() también elimina los espacios duros (&nbsp;).
  if (textContent(node).trim() !== '') return false;
  return findFirst(node.children, (child) => MEDIA_TAGS.has(child.name)) === undefined;
}
