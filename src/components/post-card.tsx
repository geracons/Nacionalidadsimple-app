import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { enterUp } from '@/constants/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useFavorites } from '@/lib/favorites';
import { formatRelativeDate } from '@/lib/text';
import type { PostSummary } from '@/lib/wp';

type Props = {
  post: PostSummary;
  variant?: 'featured' | 'row';
  /** Posición en la lista, para escalonar la animación de entrada. */
  index?: number;
};

export function openPost(post: Pick<PostSummary, 'slug'>) {
  router.push({ pathname: '/post/[slug]', params: { slug: post.slug } });
}

export function PostCard({ post, variant = 'row', index = 0 }: Props) {
  const theme = useTheme();
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(post.slug);
  const category = post.categories[0]?.name;
  const date = formatRelativeDate(new Date(post.date));
  const entering = enterUp(index);

  if (variant === 'featured') {
    return (
      <Animated.View entering={entering}>
        <PressableScale
          onPress={() => openPost(post)}
          accessibilityRole="button"
          accessibilityLabel={post.title}
          style={[styles.featured, { backgroundColor: theme.backgroundElement }]}>
          {post.image ? (
            <Image
              source={{ uri: post.image.url }}
              placeholder={{ uri: post.image.thumbUrl }}
              style={[styles.featuredImage, { backgroundColor: theme.skeleton }]}
              contentFit="cover"
              transition={300}
              recyclingKey={post.slug}
            />
          ) : (
            <ImageFallback style={styles.featuredImage} />
          )}
          <View style={styles.featuredBody}>
            <View style={styles.metaRow}>
              {category && (
                <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
                  <ThemedText type="caption" themeColor="primary">
                    {category}
                  </ThemedText>
                </View>
              )}
              <ThemedText type="small" themeColor="textSecondary">
                {date}
              </ThemedText>
            </View>
            <ThemedText type="subtitle" numberOfLines={3}>
              {post.title}
            </ThemedText>
            {post.excerpt ? (
              <ThemedText themeColor="textSecondary" numberOfLines={2}>
                {post.excerpt}
              </ThemedText>
            ) : null}
          </View>
        </PressableScale>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={entering}>
      <PressableScale
        onPress={() => openPost(post)}
        accessibilityRole="button"
        accessibilityLabel={post.title}
        style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
        {post.image ? (
          <Image
            source={{ uri: post.image.thumbUrl }}
            style={[styles.rowImage, { backgroundColor: theme.skeleton }]}
            contentFit="cover"
            transition={250}
            recyclingKey={post.slug}
          />
        ) : (
          <ImageFallback style={styles.rowImage} />
        )}
        <View style={styles.rowBody}>
          {category && (
            <ThemedText type="caption" themeColor="primary" numberOfLines={1}>
              {category}
            </ThemedText>
          )}
          <ThemedText type="heading" numberOfLines={3}>
            {post.title}
          </ThemedText>
          <View style={styles.rowFooter}>
            <ThemedText type="small" themeColor="textSecondary">
              {date}
            </ThemedText>
            <PressableScale
              hitSlop={10}
              activeScale={0.9}
              onPress={() => toggleFavorite(post)}
              accessibilityRole="button"
              accessibilityLabel={saved ? 'Quitar de guardados' : 'Guardar'}>
              <Ionicons
                name={saved ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={saved ? theme.primary : theme.textSecondary}
              />
            </PressableScale>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

/** Para entradas sin imagen destacada. */
function ImageFallback({ style }: { style: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={[style, styles.fallback, { backgroundColor: theme.primarySoft }]}>
      <Ionicons name="newspaper-outline" size={30} color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  featured: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderCurve: 'continuous',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  },
  featuredImage: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  featuredBody: {
    padding: Spacing.three + 2,
    gap: Spacing.two,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  badge: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  row: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    padding: Spacing.two + 2,
    gap: Spacing.three,
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
  },
  rowImage: {
    width: 104,
    height: 104,
    borderRadius: Radius.sm + 2,
  },
  rowBody: {
    flex: 1,
    gap: Spacing.one,
  },
  rowFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
