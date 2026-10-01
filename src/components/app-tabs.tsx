import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/hooks/use-theme';

/** Barra de pestañas 100% nativa (UITabBar en iOS, Material en Android). */
export default function AppTabs() {
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.backgroundElement}
      indicatorColor={theme.primarySoft}
      tintColor={theme.primary}
      iconColor={{ default: theme.textSecondary, selected: theme.primary }}
      labelStyle={{ default: { color: theme.textSecondary }, selected: { color: theme.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Inicio</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explorar">
        <NativeTabs.Trigger.Label>Explorar</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="servicios">
        <NativeTabs.Trigger.Label>Servicios</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'briefcase', selected: 'briefcase.fill' }}
          md="work"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="guardados">
        <NativeTabs.Trigger.Label>Guardados</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'bookmark', selected: 'bookmark.fill' }}
          md="bookmark"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
