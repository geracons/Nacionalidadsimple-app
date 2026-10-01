import { ScrollView, StyleSheet } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Category } from '@/lib/wp';

type Props = {
  categories: Category[];
  selected?: number;
  onSelect: (id: number | undefined) => void;
};

/** Fila horizontal de categorías; la primera opción ("Todo") quita el filtro. */
export function CategoryChips({ categories, selected, onSelect }: Props) {
  const theme = useTheme();
  const items: { id?: number; name: string }[] = [{ name: 'Todo' }, ...categories];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}>
      {items.map((item) => {
        const active = item.id === selected;
        return (
          <PressableScale
            key={item.id ?? 'all'}
            onPress={() => onSelect(item.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.chip,
              {
                backgroundColor: active ? theme.primary : theme.backgroundElement,
                borderColor: active ? theme.primary : theme.border,
              },
            ]}>
            <ThemedText
              type="smallBold"
              style={{ color: active ? theme.onPrimary : theme.text }}
              numberOfLines={1}>
              {item.name}
            </ThemedText>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
