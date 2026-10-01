import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children?: ReactNode;
};

/** Título grande de cada pestaña, respetando la zona segura superior. */
export function TabHeader({ title, subtitle, right, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.three }]}>
      <View style={styles.row}>
        <View style={styles.texts}>
          <ThemedText type="title">{title}</ThemedText>
          {subtitle ? <ThemedText themeColor="textSecondary">{subtitle}</ThemedText> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
  },
  texts: {
    flex: 1,
    gap: Spacing.one,
  },
});
