import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type BlockProps = {
  width?: DimensionValue;
  height: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Bloque gris que "respira" mientras carga el contenido. */
export function SkeletonBlock({ width = '100%', height, radius = Radius.sm, style }: BlockProps) {
  const theme = useTheme();
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(1, { duration: 800 }), -1, true));
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: theme.skeleton },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function PostRowSkeleton() {
  const theme = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement }]}>
      <SkeletonBlock width={104} height={104} radius={Radius.sm + 2} />
      <View style={styles.rowBody}>
        <SkeletonBlock width="40%" height={12} />
        <SkeletonBlock height={16} />
        <SkeletonBlock width="80%" height={16} />
        <SkeletonBlock width="30%" height={12} style={{ marginTop: 'auto' }} />
      </View>
    </View>
  );
}

export function FeaturedSkeleton() {
  const theme = useTheme();
  return (
    <View style={[styles.featured, { backgroundColor: theme.backgroundElement }]}>
      <SkeletonBlock height={200} radius={0} />
      <View style={styles.featuredBody}>
        <SkeletonBlock width="35%" height={14} />
        <SkeletonBlock height={22} />
        <SkeletonBlock width="70%" height={22} />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 4, featured = false }: { count?: number; featured?: boolean }) {
  return (
    <View style={styles.list}>
      {featured && <FeaturedSkeleton />}
      {Array.from({ length: count }, (_, i) => (
        <PostRowSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    padding: Spacing.two + 2,
    gap: Spacing.three,
  },
  rowBody: {
    flex: 1,
    gap: Spacing.two,
  },
  featured: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  featuredBody: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
});
