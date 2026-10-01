import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { CategoryChips } from '@/components/category-chips';
import { PostList } from '@/components/post-list';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { APP_NAME, APP_TAGLINE, SERVICES } from '@/config';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCategories } from '@/lib/queries';

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<number>();
  const categories = useCategories();
  const featuredService = SERVICES[0];

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + Spacing.three }]}>
      <View style={styles.brandRow}>
        <BrandMark size={44} />
        <View style={styles.brandTexts}>
          <ThemedText type="heading">{APP_NAME}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {APP_TAGLINE}
          </ThemedText>
        </View>
        <PressableScale
          onPress={() => router.navigate('/explorar')}
          accessibilityRole="button"
          accessibilityLabel="Buscar"
          style={[styles.iconButton, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="search" size={20} color={theme.text} />
        </PressableScale>
      </View>

      {featuredService && (
        <PressableScale
          onPress={() =>
            router.push({ pathname: '/servicio/[id]', params: { id: featuredService.id } })
          }
          accessibilityRole="button"
          style={styles.banner}>
          <View style={styles.bannerTexts}>
            <ThemedText type="caption" style={{ color: Brand.accent }}>
              Servicio destacado
            </ThemedText>
            <ThemedText type="heading" style={styles.bannerText}>
              {featuredService.title}
            </ThemedText>
            <ThemedText type="small" style={[styles.bannerText, { opacity: 0.85 }]}>
              {featuredService.summary}
            </ThemedText>
          </View>
          <View style={styles.bannerArrow}>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </View>
        </PressableScale>
      )}

      <ThemedText type="subtitle" style={styles.sectionTitle}>
        Últimos artículos
      </ThemedText>
      {categories.data && categories.data.length > 0 && (
        <CategoryChips categories={categories.data} selected={category} onSelect={setCategory} />
      )}
    </View>
  );

  return <PostList category={category} featuredFirst={!category} header={header} inTabs />;
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 4,
    paddingHorizontal: Spacing.three,
  },
  brandTexts: {
    flex: 1,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    backgroundColor: Brand.primary,
    marginHorizontal: Spacing.three,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    padding: Spacing.three + 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  bannerTexts: {
    flex: 1,
    gap: Spacing.one,
  },
  bannerText: {
    color: '#fff',
  },
  bannerArrow: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
  },
});
