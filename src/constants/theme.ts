/**
 * Colores de la app en modo claro y oscuro.
 * `primary` y `accent` son los colores de marca: cámbialos aquí para que toda la app se adapte.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Brand = {
  primary: '#1B3B8F',
  primaryDark: '#8FB0FF',
  accent: '#E8A317',
} as const;

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F7F8FB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7ECF7',
    textSecondary: '#5B6475',
    border: '#E3E7EF',
    primary: Brand.primary,
    onPrimary: '#FFFFFF',
    primarySoft: '#E8EEFB',
    accent: Brand.accent,
    skeleton: '#E6E9F0',
  },
  dark: {
    text: '#F4F6FB',
    background: '#0B0F17',
    backgroundElement: '#151B26',
    backgroundSelected: '#212A3A',
    textSecondary: '#A3ACBD',
    border: '#252D3B',
    primary: Brand.primaryDark,
    onPrimary: '#0B0F17',
    primarySoft: '#1C2741',
    accent: Brand.accent,
    skeleton: '#1E2532',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ThemeColors = { [K in ThemeColor]: string };

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 720;
