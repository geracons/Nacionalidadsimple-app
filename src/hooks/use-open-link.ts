import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback } from 'react';
import { Linking } from 'react-native';

import { SERVICES, WP_URL } from '@/config';
import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { categorySlugFromUrl, internalSlugFromUrl } from '@/lib/wp';

/** Convierte "/tramites/nie/" o "//dominio.com/x" en una URL absoluta. */
export function absoluteUrl(href: string): string {
  if (href.startsWith('//')) return `https:${href}`;
  if (href.startsWith('/')) return `${WP_URL}${href}`;
  return href;
}

/** Abre una web dentro de la app (Safari View Controller / Chrome Custom Tabs). */
export function openInAppBrowser(url: string, theme: ThemeColors) {
  return WebBrowser.openBrowserAsync(url, {
    controlsColor: theme.primary,
    toolbarColor: theme.background,
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  }).catch(() => Linking.openURL(url));
}

/** Misma página ignorando "#ancla", "?query" y la barra final. */
export function isSamePage(a: string, b: string) {
  const normalize = (url: string) => absoluteUrl(url).split(/[?#]/)[0].replace(/\/+$/, '').toLowerCase();
  return normalize(a) === normalize(b);
}

/**
 * Abre un enlace del contenido de la forma más natural:
 * - Entradas/páginas de la web → pantalla nativa de la app.
 * - Teléfono, email, WhatsApp → app correspondiente.
 * - Resto → navegador integrado (sin salir de la app).
 */
export function useOpenLink() {
  const theme = useTheme();

  return useCallback(
    (href: string) => {
      const url = absoluteUrl(href.trim());

      if (/^(mailto|tel|sms|whatsapp):/i.test(url) || /wa\.me\/|api\.whatsapp\.com/i.test(url)) {
        Linking.openURL(url).catch(() => {});
        return;
      }

      const category = categorySlugFromUrl(url);
      if (category) {
        router.push({ pathname: '/categoria/[slug]', params: { slug: category } });
        return;
      }

      const slug = internalSlugFromUrl(url);
      // Las páginas de servicios (p. ej. /apostillas) se abren en su ficha nativa.
      const service = slug ? SERVICES.find((item) => item.pageSlug === slug) : undefined;
      if (service) {
        router.push({ pathname: '/servicio/[id]', params: { id: service.id } });
        return;
      }
      if (slug) {
        router.push({ pathname: '/post/[slug]', params: { slug } });
        return;
      }

      if (/^https?:\/\//i.test(url)) openInAppBrowser(url, theme);
    },
    [theme]
  );
}
