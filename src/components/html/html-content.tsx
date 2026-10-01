/**
 * Renderizador nativo del contenido de WordPress.
 * Recorre el árbol de `parse.ts` y pinta cada etiqueta con componentes de React Native,
 * imitando los estilos del bloque de contenido de la web (Gutenberg / editor clásico).
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Fragment, memo, useMemo, useState, type ReactNode } from 'react';
import {
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
} from 'react-native';

import { ImageViewer } from '@/components/html/image-viewer';
import {
  classIncludes,
  cleanContent,
  findFirst,
  hasClass,
  normalizeInlineWhitespace,
  parseHtml,
  textContent,
  youtubeId,
  type HtmlElement,
  type HtmlNode,
  type HtmlText,
} from '@/components/html/parse';
import { BrandFonts, Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  html: string;
  /** Ancho disponible para el contenido (se usa en imágenes y tablas). */
  width: number;
  /** Multiplicador del tamaño de letra elegido por el usuario. */
  fontScale?: number;
  /** ID de la imagen destacada, para no repetirla dentro del contenido. */
  featuredMediaId?: number;
  onLinkPress: (href: string) => void;
};

/** Etiquetas que siempre se pintan como bloque (no pueden ir dentro de un <Text>). */
const BLOCK_TAGS = new Set([
  'p',
  'div',
  'section',
  'article',
  'aside',
  'header',
  'footer',
  'main',
  'nav',
  'figure',
  'figcaption',
  'blockquote',
  'ul',
  'ol',
  'li',
  'dl',
  'dt',
  'dd',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'pre',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'img',
  'picture',
  'video',
  'iframe',
  'embed',
  'object',
  'details',
  'summary',
  'center',
]);

function isBlock(node: HtmlNode): boolean {
  if (node.type === 'text') return false;
  if (BLOCK_TAGS.has(node.name)) return true;
  // Botones (Gutenberg / Elementor) se pintan como botón aunque sean un <a>.
  if (node.name === 'a' && isButtonLink(node)) return true;
  // Un <a> o <span> que envuelve una imagen o un bloque se trata como bloque.
  return node.children.some(isBlock);
}

type Ctx = {
  theme: ThemeColors;
  width: number;
  onLinkPress: (href: string) => void;
  openImage: (uri: string) => void;
  styles: ReturnType<typeof createStyles>;
};

type InlineState = {
  whitespace: Map<HtmlText, string>;
};

// ---------- En línea ----------

function renderInline(node: HtmlNode, ctx: Ctx, state: InlineState, key: string): ReactNode {
  if (node.type === 'text') {
    const text = state.whitespace.get(node) ?? node.data;
    return text ? <Fragment key={key}>{text}</Fragment> : null;
  }
  const { styles } = ctx;
  const children = (s: InlineState = state) =>
    node.children.map((child, i) => renderInline(child, ctx, s, `${key}.${i}`));

  switch (node.name) {
    case 'br':
      return <Fragment key={key}>{'\n'}</Fragment>;
    case 'strong':
    case 'b':
      return (
        <Text key={key} style={styles.bold}>
          {children()}
        </Text>
      );
    case 'em':
    case 'i':
    case 'cite':
      return (
        <Text key={key} style={styles.italic}>
          {children()}
        </Text>
      );
    case 'u':
    case 'ins':
      return (
        <Text key={key} style={styles.underline}>
          {children()}
        </Text>
      );
    case 's':
    case 'del':
    case 'strike':
      return (
        <Text key={key} style={styles.strike}>
          {children()}
        </Text>
      );
    case 'code':
    case 'kbd':
      return (
        <Text key={key} style={styles.inlineCode}>
          {children()}
        </Text>
      );
    case 'mark':
      return (
        <Text key={key} style={styles.mark}>
          {children()}
        </Text>
      );
    case 'sup':
    case 'sub':
    case 'small':
      return (
        <Text key={key} style={styles.smallInline}>
          {children()}
        </Text>
      );
    case 'a': {
      const href = node.attribs.href;
      if (!href || href.startsWith('#')) return <Fragment key={key}>{children()}</Fragment>;
      return (
        <Text
          key={key}
          style={styles.link}
          accessibilityRole="link"
          onPress={() => ctx.onLinkPress(href)}>
          {children()}
        </Text>
      );
    }
    default:
      return <Fragment key={key}>{children()}</Fragment>;
  }
}

function InlineRun({
  nodes,
  ctx,
  style,
  href,
}: {
  nodes: HtmlNode[];
  ctx: Ctx;
  style?: TextStyle | TextStyle[];
  href?: string;
}) {
  const whitespace = normalizeInlineWhitespace(nodes);
  const hasText = [...whitespace.values()].some((text) => text.trim().length > 0);
  if (!hasText) return null;
  const content = nodes.map((node, i) => renderInline(node, ctx, { whitespace }, `${i}`));
  // En iOS un <Text selectable> puede bloquear el toque en los enlaces anidados.
  const hasLink = Boolean(href) || nodes.some((node) => findFirst([node], (el) => el.name === 'a'));
  return (
    <Text selectable={!hasLink} style={[ctx.styles.paragraph, style]}>
      {href ? (
        <Text style={ctx.styles.link} onPress={() => ctx.onLinkPress(href)}>
          {content}
        </Text>
      ) : (
        content
      )}
    </Text>
  );
}

// ---------- Bloques ----------

type BlockOptions = {
  textStyle?: TextStyle | TextStyle[];
  href?: string;
  /** Dentro de listas los párrafos no llevan margen inferior. */
  compact?: boolean;
};

/** Pinta una lista de nodos agrupando el texto en línea en párrafos <Text>. */
function renderChildren(nodes: HtmlNode[], ctx: Ctx, options: BlockOptions = {}, keyPrefix = '') {
  const output: ReactNode[] = [];
  let run: HtmlNode[] = [];

  const flush = () => {
    if (run.length === 0) return;
    output.push(
      <InlineRun
        key={`${keyPrefix}r${output.length}`}
        nodes={run}
        ctx={ctx}
        style={options.textStyle}
        href={options.href}
      />
    );
    run = [];
  };

  nodes.forEach((node, i) => {
    if (isBlock(node)) {
      flush();
      output.push(renderBlock(node as HtmlElement, ctx, options, `${keyPrefix}${i}`));
    } else {
      run.push(node);
    }
  });
  flush();
  return output;
}

function renderBlock(node: HtmlElement, ctx: Ctx, options: BlockOptions, key: string): ReactNode {
  const { styles } = ctx;
  const align = textAlign(node);
  const textStyle = align
    ? [...toArray(options.textStyle), { textAlign: align } as TextStyle]
    : options.textStyle;

  switch (node.name) {
    case 'p':
      return (
        <View key={key} style={options.compact ? styles.paragraphCompact : styles.paragraphBlock}>
          {renderChildren(node.children, ctx, { ...options, textStyle }, `${key}.`)}
        </View>
      );

    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return (
        <View key={key} style={styles.headingBlock}>
          {renderChildren(
            node.children,
            ctx,
            { ...options, textStyle: [...toArray(textStyle), styles[node.name]] },
            `${key}.`
          )}
        </View>
      );

    case 'ul':
    case 'ol':
      return <List key={key} node={node} ctx={ctx} ordered={node.name === 'ol'} />;

    case 'blockquote':
      return (
        <View
          key={key}
          style={[styles.quote, hasClass(node, 'is-style-large') && styles.quoteLarge]}>
          {renderChildren(
            node.children,
            ctx,
            { ...options, textStyle: [...toArray(textStyle), styles.quoteText] },
            `${key}.`
          )}
        </View>
      );

    case 'hr':
      return <View key={key} style={styles.hr} />;

    case 'pre':
      return (
        <ScrollView key={key} horizontal style={styles.pre} showsHorizontalScrollIndicator={false}>
          <Text selectable style={styles.preText}>
            {textContent(node)}
          </Text>
        </ScrollView>
      );

    case 'img':
      return <HtmlImage key={key} node={node} ctx={ctx} href={options.href} />;

    case 'picture': {
      const img = findFirst(node.children, (child) => child.name === 'img');
      return img ? <HtmlImage key={key} node={img} ctx={ctx} href={options.href} /> : null;
    }

    case 'figure':
      return renderFigure(node, ctx, options, key);

    case 'figcaption':
      return (
        <View key={key} style={styles.captionBlock}>
          {renderChildren(node.children, ctx, { textStyle: styles.caption }, `${key}.`)}
        </View>
      );

    case 'iframe':
    case 'embed':
    case 'video':
    case 'object':
      return <Embed key={key} src={embedSource(node)} ctx={ctx} />;

    case 'table':
      return <Table key={key} node={node} ctx={ctx} />;

    case 'details':
      return <Details key={key} node={node} ctx={ctx} />;

    case 'a':
      // Enlace que envuelve imágenes/bloques; los botones de Gutenberg tienen su propio estilo.
      if (isButtonLink(node)) {
        return (
          <View key={key} style={styles.buttons}>
            <ButtonLink node={node} ctx={ctx} />
          </View>
        );
      }
      return (
        <Fragment key={key}>
          {renderChildren(node.children, ctx, { ...options, href: node.attribs.href }, `${key}.`)}
        </Fragment>
      );

    default:
      return renderContainer(node, ctx, { ...options, textStyle }, key);
  }
}

/** div, section… y bloques de Gutenberg con estilo propio. */
function renderContainer(node: HtmlElement, ctx: Ctx, options: BlockOptions, key: string) {
  const { styles } = ctx;

  if (hasClass(node, 'wp-block-spacer')) return <View key={key} style={styles.spacer} />;

  if (hasClass(node, 'wp-block-buttons') || hasClass(node, 'wp-block-button')) {
    const links: HtmlElement[] = [];
    const collect = (nodes: HtmlNode[]) =>
      nodes.forEach((child) => {
        if (child.type !== 'element') return;
        if (child.name === 'a') links.push(child);
        else collect(child.children);
      });
    collect(node.children);
    return (
      <View key={key} style={styles.buttons}>
        {links.map((link, i) => (
          <ButtonLink key={i} node={link} ctx={ctx} />
        ))}
      </View>
    );
  }

  // Bloque de embed de Gutenberg sin iframe (sólo la URL dentro del wrapper).
  if (hasClass(node, 'wp-block-embed__wrapper')) {
    const iframe = findFirst(node.children, (child) => child.name === 'iframe');
    const src = iframe ? embedSource(iframe) : textContent(node).trim();
    if (/^https?:\/\//.test(src)) return <Embed key={key} src={src} ctx={ctx} />;
  }

  // Cajas destacadas: grupos con fondo, avisos, "alert", "notice"…
  const isCallout =
    (hasClass(node, 'wp-block-group') && hasClass(node, 'has-background')) ||
    classIncludes(node, 'alert') ||
    classIncludes(node, 'notice') ||
    classIncludes(node, 'callout') ||
    classIncludes(node, 'su-note') ||
    classIncludes(node, 'su-box');
  if (isCallout) {
    return (
      <View key={key} style={styles.callout}>
        {renderChildren(node.children, ctx, options, `${key}.`)}
      </View>
    );
  }

  return (
    <Fragment key={key}>{renderChildren(node.children, ctx, options, `${key}.`)}</Fragment>
  );
}

function renderFigure(node: HtmlElement, ctx: Ctx, options: BlockOptions, key: string) {
  if (hasClass(node, 'wp-block-table')) {
    return (
      <View key={key} style={ctx.styles.figure}>
        {renderChildren(node.children, ctx, options, `${key}.`)}
      </View>
    );
  }
  if (classIncludes(node, 'wp-block-embed')) {
    const iframe = findFirst(node.children, (child) => child.name === 'iframe');
    const src = iframe ? embedSource(iframe) : textContent(node).trim().split(/\s+/)[0];
    if (src) return <Embed key={key} src={src} ctx={ctx} />;
  }
  return (
    <View key={key} style={ctx.styles.figure}>
      {renderChildren(node.children, ctx, options, `${key}.`)}
    </View>
  );
}

// ---------- Componentes ----------

function List({ node, ctx, ordered }: { node: HtmlElement; ctx: Ctx; ordered: boolean }) {
  const { styles } = ctx;
  const start = Number(node.attribs.start ?? 1) || 1;
  const items = node.children.filter(
    (child): child is HtmlElement => child.type === 'element' && child.name === 'li'
  );
  return (
    <View style={styles.list}>
      {items.map((item, i) => (
        <View key={i} style={styles.listItem}>
          {ordered ? (
            <Text style={[styles.paragraph, styles.listNumber]}>{start + i}.</Text>
          ) : (
            <View style={styles.bulletWrap}>
              <View style={styles.bullet} />
            </View>
          )}
          <View style={styles.listContent}>
            {renderChildren(item.children, ctx, { compact: true }, `${i}.`)}
          </View>
        </View>
      ))}
    </View>
  );
}

function HtmlImage({ node, ctx, href }: { node: HtmlElement; ctx: Ctx; href?: string }) {
  const { attribs } = node;
  const uri = bestImageSource(attribs);
  const declaredWidth = Number(attribs.width) || undefined;
  const declaredHeight = Number(attribs.height) || undefined;
  const [ratio, setRatio] = useState(
    declaredWidth && declaredHeight ? declaredWidth / declaredHeight : undefined
  );
  if (!uri || uri.startsWith('data:')) return null;

  // Las imágenes pequeñas (iconos, logos) no se estiran a todo el ancho.
  const width = declaredWidth ? Math.min(declaredWidth, ctx.width) : ctx.width;

  return (
    <Pressable
      onPress={() => {
        // "Enlazar a archivo multimedia" de WordPress: abrimos el visor en vez del navegador.
        if (href && !IMAGE_FILE.test(href)) ctx.onLinkPress(href);
        else ctx.openImage(href ?? uri);
      }}
      style={({ pressed }) => [ctx.styles.imageWrap, pressed && { opacity: 0.85 }]}
      accessibilityRole={href ? 'link' : 'imagebutton'}
      accessibilityLabel={attribs.alt || 'Imagen'}>
      <Image
        source={{ uri }}
        style={[ctx.styles.image, { width, aspectRatio: ratio ?? 16 / 9 }]}
        contentFit="cover"
        transition={250}
        accessibilityLabel={attribs.alt}
        onLoad={(event) => {
          const { width: w, height: h } = event.source;
          if (!ratio && w && h) setRatio(w / h);
        }}
      />
    </Pressable>
  );
}

function Embed({ src, ctx }: { src: string; ctx: Ctx }) {
  const { styles, theme } = ctx;
  if (!src) return null;
  const videoId = youtubeId(src);
  const href = videoId ? `https://www.youtube.com/watch?v=${videoId}` : src;
  return (
    <Pressable
      onPress={() => ctx.onLinkPress(href)}
      style={({ pressed }) => [styles.embed, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel={videoId ? 'Reproducir vídeo' : 'Abrir contenido'}>
      {videoId ? (
        <>
          <Image
            source={{ uri: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={250}
          />
          <View style={styles.playButton}>
            <Ionicons name="play" size={30} color="#fff" style={{ marginLeft: 4 }} />
          </View>
        </>
      ) : (
        <View style={styles.embedFallback}>
          <Ionicons name="open-outline" size={28} color={theme.primary} />
          <Text style={[styles.paragraph, styles.bold]}>Abrir contenido</Text>
          <Text numberOfLines={1} style={styles.caption}>
            {src.replace(/^https?:\/\//, '')}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function Table({ node, ctx }: { node: HtmlElement; ctx: Ctx }) {
  const { styles } = ctx;
  const rows: HtmlElement[] = [];
  const collectRows = (nodes: HtmlNode[]) =>
    nodes.forEach((child) => {
      if (child.type !== 'element') return;
      if (child.name === 'tr') rows.push(child);
      else if (child.name !== 'table') collectRows(child.children);
    });
  collectRows(node.children);

  const cellsOf = (row: HtmlElement) =>
    row.children.filter(
      (cell): cell is HtmlElement =>
        cell.type === 'element' && (cell.name === 'td' || cell.name === 'th')
    );
  const columns = Math.max(1, ...rows.map((row) => cellsOf(row).length));
  // En pantallas estrechas la tabla hace scroll horizontal, como en la web móvil.
  const columnWidth = Math.max(140, Math.floor(ctx.width / columns));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={columns * columnWidth > ctx.width}
      style={styles.tableScroll}
      contentContainerStyle={styles.table}>
      <View>
        {rows.map((row, r) => {
          const header =
            row.children.some((cell) => cell.type === 'element' && cell.name === 'th') ||
            (r === 0 && findFirst([node], (child) => child.name === 'thead') !== undefined);
          return (
            <View
              key={r}
              style={[styles.tableRow, header && styles.tableHeader, r % 2 === 1 && styles.tableRowAlt]}>
              {cellsOf(row).map((cell, c) => {
                const span = Number(cell.attribs.colspan) || 1;
                return (
                  <View key={c} style={[styles.tableCell, { width: columnWidth * span }]}>
                    {renderChildren(
                      cell.children,
                      ctx,
                      { textStyle: header ? [styles.tableText, styles.bold] : styles.tableText },
                      `${r}.${c}.`
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function Details({ node, ctx }: { node: HtmlElement; ctx: Ctx }) {
  const { styles, theme } = ctx;
  const [open, setOpen] = useState('open' in node.attribs);
  const summary = node.children.find(
    (child): child is HtmlElement => child.type === 'element' && child.name === 'summary'
  );
  const body = node.children.filter((child) => child !== summary);

  return (
    <View style={styles.details}>
      <Pressable
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen((value) => !value);
        }}
        style={styles.summary}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}>
        <Text style={[styles.paragraph, styles.bold, { flex: 1 }]}>
          {summary ? textContent(summary).trim() : 'Ver más'}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={theme.primary} />
      </Pressable>
      {open && <View style={styles.detailsBody}>{renderChildren(body, ctx)}</View>}
    </View>
  );
}

function ButtonLink({ node, ctx }: { node: HtmlElement; ctx: Ctx }) {
  const { styles } = ctx;
  const href = node.attribs.href;
  const label = textContent(node).trim();
  if (!href || !label) return null;
  return (
    <Pressable
      onPress={() => ctx.onLinkPress(href)}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
      accessibilityRole="link">
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

// ---------- Utilidades ----------

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function textAlign(node: HtmlElement): TextStyle['textAlign'] | undefined {
  const className = node.attribs.class ?? '';
  const style = node.attribs.style ?? '';
  if (/has-text-align-center|aligncenter|text-center/.test(className) || /text-align:\s*center/.test(style))
    return 'center';
  if (/has-text-align-right|alignright|text-right/.test(className) || /text-align:\s*right/.test(style))
    return 'right';
  return undefined;
}

const IMAGE_FILE = /\.(jpe?g|png|gif|webp|avif)(\?.*)?$/i;

function isButtonLink(node: HtmlElement) {
  return /wp-block-button__link|\bbutton\b|\bbtn\b|wp-element-button/.test(node.attribs.class ?? '');
}

function bestImageSource(attribs: Record<string, string>): string | undefined {
  // Plugins de lazy-load ponen la imagen real en data-src / data-lazy-src.
  const src = attribs['data-lazy-src'] || attribs['data-src'] || attribs.src;
  const srcset = attribs['data-lazy-srcset'] || attribs['data-srcset'] || attribs.srcset;
  if (srcset) {
    // Elegimos la variante más cercana a ~1200px para que se vea nítida sin pesar demasiado.
    const candidates = srcset
      .split(',')
      .map((entry) => entry.trim().split(/\s+/))
      .map(([url, size]) => ({ url, width: parseInt(size ?? '', 10) || 0 }))
      .filter((candidate) => candidate.url && candidate.width > 0)
      .sort((a, b) => a.width - b.width);
    const best = candidates.find((candidate) => candidate.width >= 1000) ?? candidates.at(-1);
    if (best) return best.url;
  }
  return src;
}

function embedSource(node: HtmlElement): string {
  const { attribs } = node;
  const direct = attribs['data-src'] || attribs['data-lazy-src'] || attribs.src || attribs.data;
  if (direct) return direct.startsWith('//') ? `https:${direct}` : direct;
  const source = findFirst(node.children, (child) => child.name === 'source');
  return source?.attribs.src ?? '';
}

// ---------- Componente principal ----------

export const HtmlContent = memo(function HtmlContent({
  html,
  width,
  fontScale = 1,
  featuredMediaId,
  onLinkPress,
}: Props) {
  const theme = useTheme();
  const nodes = useMemo(
    () => cleanContent(parseHtml(html), { featuredMediaId }),
    [html, featuredMediaId]
  );
  const styles = useMemo(() => createStyles(theme, fontScale), [theme, fontScale]);
  const [viewerUri, setViewerUri] = useState<string>();

  const ctx: Ctx = { theme, width, onLinkPress, openImage: setViewerUri, styles };

  return (
    <View>
      {renderChildren(nodes, ctx)}
      <ImageViewer uri={viewerUri} onClose={() => setViewerUri(undefined)} />
    </View>
  );
});

function createStyles(theme: ThemeColors, scale: number) {
  const size = (value: number) => Math.round(value * scale);
  return StyleSheet.create({
    paragraph: {
      color: theme.text,
      fontSize: size(17),
      lineHeight: size(28),
    },
    paragraphBlock: {
      marginBottom: Spacing.three,
    },
    paragraphCompact: {
      marginBottom: 0,
    },
    headingBlock: {
      marginTop: Spacing.three,
      marginBottom: Spacing.two,
    },
    h1: { fontFamily: BrandFonts.extraBold, fontSize: size(27), lineHeight: size(34), letterSpacing: -0.5 },
    h2: { fontFamily: BrandFonts.extraBold, fontSize: size(23), lineHeight: size(30), letterSpacing: -0.4 },
    h3: { fontFamily: BrandFonts.bold, fontSize: size(19.5), lineHeight: size(27), letterSpacing: -0.2 },
    h4: { fontFamily: BrandFonts.bold, fontSize: size(17.5), lineHeight: size(25) },
    h5: { fontSize: size(17), lineHeight: size(24), fontWeight: 700 },
    h6: {
      fontSize: size(15),
      lineHeight: size(22),
      fontWeight: 700,
      textTransform: 'uppercase',
      color: theme.textSecondary,
    },
    bold: { fontWeight: 700 },
    italic: { fontStyle: 'italic' },
    underline: { textDecorationLine: 'underline' },
    strike: { textDecorationLine: 'line-through' },
    smallInline: { fontSize: size(13) },
    mark: { backgroundColor: theme.accent + '55' },
    inlineCode: {
      fontFamily: Fonts.mono,
      fontSize: size(15),
      backgroundColor: theme.backgroundSelected,
    },
    link: {
      color: theme.primary,
      fontWeight: 600,
      textDecorationLine: 'underline',
      textDecorationColor: theme.primary + '66',
    },
    list: {
      marginBottom: Spacing.three,
      gap: Spacing.two,
    },
    listItem: {
      flexDirection: 'row',
      gap: Spacing.two,
    },
    listNumber: {
      minWidth: size(22),
      fontWeight: 700,
      color: theme.primary,
    },
    bulletWrap: {
      height: size(28),
      width: size(18),
      justifyContent: 'center',
    },
    bullet: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.primary,
    },
    listContent: {
      flex: 1,
    },
    quote: {
      borderLeftWidth: 4,
      borderLeftColor: theme.primary,
      backgroundColor: theme.primarySoft,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.three,
      paddingTop: Spacing.three,
      paddingBottom: Spacing.one,
      marginBottom: Spacing.three,
    },
    quoteLarge: {
      borderLeftWidth: 6,
    },
    quoteText: {
      fontStyle: 'italic',
    },
    callout: {
      backgroundColor: theme.primarySoft,
      borderRadius: Radius.md,
      padding: Spacing.three,
      paddingBottom: Spacing.one,
      marginBottom: Spacing.three,
    },
    hr: {
      height: StyleSheet.hairlineWidth * 2,
      backgroundColor: theme.border,
      marginVertical: Spacing.four,
    },
    pre: {
      backgroundColor: theme.backgroundSelected,
      borderRadius: Radius.sm,
      padding: Spacing.three,
      marginBottom: Spacing.three,
    },
    preText: {
      fontFamily: Fonts.mono,
      fontSize: size(14),
      lineHeight: size(20),
      color: theme.text,
    },
    figure: {
      marginBottom: Spacing.three,
    },
    imageWrap: {
      alignSelf: 'center',
      marginBottom: Spacing.two,
    },
    image: {
      borderRadius: Radius.md,
      backgroundColor: theme.skeleton,
    },
    captionBlock: {
      marginTop: -Spacing.one,
      marginBottom: Spacing.two,
    },
    caption: {
      color: theme.textSecondary,
      fontSize: size(13),
      lineHeight: size(18),
      textAlign: 'center',
    },
    embed: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: Radius.md,
      overflow: 'hidden',
      backgroundColor: theme.backgroundSelected,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.three,
    },
    embedFallback: {
      alignItems: 'center',
      gap: Spacing.one,
      paddingHorizontal: Spacing.four,
    },
    playButton: {
      width: 68,
      height: 68,
      borderRadius: 34,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tableScroll: {
      marginBottom: Spacing.three,
      borderRadius: Radius.sm,
      borderWidth: 1,
      borderColor: theme.border,
    },
    table: {
      flexGrow: 1,
    },
    tableRow: {
      flexDirection: 'row',
      backgroundColor: theme.backgroundElement,
    },
    tableRowAlt: {
      backgroundColor: theme.background,
    },
    tableHeader: {
      backgroundColor: theme.primarySoft,
    },
    tableCell: {
      paddingHorizontal: Spacing.two + 2,
      paddingTop: Spacing.two,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    tableText: {
      fontSize: size(14),
      lineHeight: size(20),
      marginBottom: Spacing.two,
    },
    details: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: Radius.md,
      backgroundColor: theme.backgroundElement,
      marginBottom: Spacing.two + 4,
      overflow: 'hidden',
    },
    summary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      padding: Spacing.three,
    },
    detailsBody: {
      paddingHorizontal: Spacing.three,
    },
    buttons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.two,
      marginBottom: Spacing.three,
    },
    button: {
      alignItems: 'center',
      backgroundColor: theme.primary,
      borderRadius: Radius.pill,
      paddingVertical: Spacing.three - 4,
      paddingHorizontal: Spacing.four,
    },
    buttonText: {
      color: theme.onPrimary,
      fontWeight: 700,
      fontSize: size(16),
    },
    spacer: {
      height: Spacing.four,
    },
  });
}
