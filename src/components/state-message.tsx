import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Mensaje centrado para listas vacías, errores o sin conexión. */
export function StateMessage({ icon, title, message, actionLabel, onAction }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={30} color={theme.primary} />
      </View>
      <ThemedText type="heading" style={styles.center}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText themeColor="textSecondary" style={styles.center}>
          {message}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <PressableScale
          onPress={onAction}
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: theme.primary }]}>
          <ThemedText type="smallBold" style={{ color: theme.onPrimary }}>
            {actionLabel}
          </ThemedText>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.six,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  center: {
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 4,
    borderRadius: Radius.pill,
  },
});
