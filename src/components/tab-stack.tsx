import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

/**
 * Pila de navegación de cada pestaña. Así, al abrir un artículo, una categoría
 * o un servicio, la barra de pestañas sigue visible.
 */
export function TabStack({ root }: { root: string }) {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: theme.primary,
        headerTitleStyle: { color: theme.text },
        headerStyle: { backgroundColor: theme.background },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name={root} options={{ headerShown: false }} />
      <Stack.Screen name="post/[slug]" options={{ headerShown: false }} />
      <Stack.Screen name="categoria/[slug]" options={{ title: '' }} />
      <Stack.Screen name="servicio/[id]" options={{ title: 'Servicio' }} />
    </Stack>
  );
}
