import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PostCard } from '@/components/post-card';
import { StateMessage } from '@/components/state-message';
import { TabHeader } from '@/components/tab-header';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFavorites } from '@/lib/favorites';

export default function SavedScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { favorites } = useFavorites();

  return (
    <FlatList
      data={favorites}
      keyExtractor={(post) => post.slug}
      renderItem={({ item, index }) => (
        <View style={styles.item}>
          <PostCard post={item} index={index} />
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        <TabHeader
          title="Guardados"
          subtitle={
            favorites.length > 0
              ? 'Tus artículos para leer cuando quieras'
              : 'Guarda artículos para tenerlos siempre a mano'
          }
        />
      }
      ListEmptyComponent={
        <StateMessage
          icon="bookmark-outline"
          title="Aún no has guardado nada"
          message="Pulsa el icono de marcador en cualquier artículo y aparecerá aquí."
        />
      }
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: BottomTabInset + insets.bottom + Spacing.four },
      ]}
    />
  );
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
});
