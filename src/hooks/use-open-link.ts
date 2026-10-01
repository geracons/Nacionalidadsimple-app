import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback } from 'react';
import { Linking } from 'react-native';

import { WP_URL } from '@/config';
import { useTheme } from '@/hooks/use-theme';
import { categorySlugFromUrl, internalSlugFromUrl } from '@/lib/wp';

/** Convierte "/tramites/nie/" o "//dominio.com/x" en una URL absoluta. */
export function absoluteUrl(href: string): string {
  if (href.startsWith('//')) return `https:${href}`;
  if (href.startsWith('/')) return `${WP_URL}${href}`;
  return href;
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
      if (slug) {
        router.push({ pathname: '/post/[slug]', params: { slug } });
        return;
      }

      if (/^https?:\/\//i.test(url)) {
        WebBrowser.openBrowserAsync(url, {
          controlsColor: theme.primary,
          toolbarColor: theme.background,
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        }).catch(() => Linking.openURL(url));
      }
    },
    [theme]
  );
}
