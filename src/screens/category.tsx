import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PostList } from '@/components/post-list';
import { StateMessage } from '@/components/state-message';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCategories } from '@/lib/queries';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const { data, isPending, isError, refetch } = useCategories();
  const category = data?.find((item) => item.slug === slug);

  if (!category) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        {isPending ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <StateMessage
            icon="folder-open-outline"
            title={isError ? 'No se pudo cargar la categoría' : 'Categoría no encontrada'}
            actionLabel={isError ? 'Reintentar' : undefined}
            onAction={isError ? () => refetch() : undefined}
          />
        )}
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: category.name }} />
      <PostList
        category={category.id}
        header={
          <View style={styles.header}>
            <ThemedText type="title">{category.name}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {category.description ||
                `${category.count} ${category.count === 1 ? 'artículo' : 'artículos'}`}
            </ThemedText>
          </View>
        }
        emptyTitle="Todavía no hay artículos en esta categoría"
        inTabs
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    gap: Spacing.one,
  },
});
