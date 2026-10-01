import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { FavoritesProvider } from '@/lib/favorites';
import { QueryProvider } from '@/lib/query-provider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colors = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
  };

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryProvider>
      <FavoritesProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerBackButtonDisplayMode: 'minimal',
              headerTintColor: colors.primary,
              headerTitleStyle: { color: colors.text },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.background },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Inicio' }} />
            <Stack.Screen name="post/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="categoria/[slug]" options={{ title: '' }} />
            <Stack.Screen name="servicio/[id]" options={{ title: '' }} />
          </Stack>
        </ThemeProvider>
      </FavoritesProvider>
    </QueryProvider>
  );
}
