import { useMemo, type ReactElement } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PostCard } from '@/components/post-card';
import { ListSkeleton } from '@/components/skeleton';
import { StateMessage } from '@/components/state-message';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { usePosts } from '@/lib/queries';
import type { PostSummary } from '@/lib/wp';

type Props = {
  category?: number;
  search?: string;
  /** La primera entrada se muestra en grande. */
  featuredFirst?: boolean;
  header?: ReactElement;
  emptyTitle?: string;
  emptyMessage?: string;
  /** Deja hueco para la barra de pestañas. */
  inTabs?: boolean;
};

/** Lista de entradas con scroll infinito, "tirar para refrescar" y estados de carga/error. */
export function PostList({
  category,
  search,
  featuredFirst = false,
  header,
  emptyTitle = 'No hay artículos',
  emptyMessage,
  inTabs = false,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const query = usePosts({ category, search });

  const posts = useMemo(() => {
    const all = query.data?.pages.flatMap((page) => page.posts) ?? [];
    // Evita duplicados si se publica algo mientras se pagina.
    const seen = new Set<number>();
    return all.filter((post) => (seen.has(post.id) ? false : (seen.add(post.id), true)));
  }, [query.data]);

  const renderItem = ({ item, index }: { item: PostSummary; index: number }) => (
    <View style={styles.item}>
      <PostCard
        post={item}
        index={index}
        variant={featuredFirst && index === 0 ? 'featured' : 'row'}
      />
    </View>
  );

  const empty = query.isPending ? (
    <ListSkeleton featured={featuredFirst} />
  ) : query.isError ? (
    <StateMessage
      icon="cloud-offline-outline"
      title="No se pudo cargar"
      message={query.error.message}
      actionLabel="Reintentar"
      onAction={() => query.refetch()}
    />
  ) : (
    <StateMessage icon="document-text-outline" title={emptyTitle} message={emptyMessage} />
  );

  return (
    <FlatList
      data={posts}
      keyExtractor={(post) => String(post.id)}
      renderItem={renderItem}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <ActivityIndicator style={styles.footer} color={theme.primary} />
        ) : null
      }
      ItemSeparatorComponent={Separator}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
      }}
      onEndReachedThreshold={0.6}
      refreshControl={
        <RefreshControl
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={() => query.refetch()}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingBottom: (inTabs ? BottomTabInset : 0) + insets.bottom + Spacing.four,
        },
      ]}
      contentInsetAdjustmentBehavior="never"
      removeClippedSubviews
      initialNumToRender={6}
      windowSize={9}
    />
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  item: {
    paddingHorizontal: Spacing.three,
  },
  separator: {
    height: Spacing.three,
  },
  footer: {
    marginVertical: Spacing.four,
  },
});
