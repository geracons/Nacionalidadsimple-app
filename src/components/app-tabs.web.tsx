import Ionicons from '@expo/vector-icons/Ionicons';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; href: '/' | '/explorar' | '/servicios' | '/guardados'; label: string; icon: IconName }[] = [
  { name: '(inicio)', href: '/', label: 'Inicio', icon: 'home' },
  { name: '(explorar)', href: '/explorar', label: 'Explorar', icon: 'search' },
  { name: '(servicios)', href: '/servicios', label: 'Servicios', icon: 'briefcase' },
  { name: '(guardados)', href: '/guardados', label: 'Guardados', icon: 'bookmark' },
];

/** Versión web (sólo para previsualizar en el navegador): barra inferior similar a la nativa. */
export default function AppTabs() {
  const theme = useTheme();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList
        style={[
          styles.bar,
          { backgroundColor: theme.backgroundElement, borderTopColor: theme.border },
        ]}>
        {TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton icon={tab.icon}>{tab.label}</TabButton>
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

function TabButton({
  children,
  isFocused,
  icon,
  ...props
}: TabTriggerSlotProps & { icon: IconName }) {
  const theme = useTheme();
  const color = isFocused ? theme.primary : theme.textSecondary;
  return (
    <Pressable {...props} style={styles.button}>
      <View style={[styles.pill, isFocused && { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={isFocused ? icon : (`${icon}-outline` as IconName)} size={22} color={color} />
      </View>
      <ThemedText type="small" style={{ color, fontSize: 12 }}>
        {children}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  pill: {
    paddingHorizontal: Spacing.three + 4,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
});
