import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeUp } from '@/components/fade-up';
import { PostList } from '@/components/post-list';
import { PressableScale } from '@/components/pressable-scale';
import { SkeletonBlock } from '@/components/skeleton';
import { StateMessage } from '@/components/state-message';
import { TabHeader } from '@/components/tab-header';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCategories } from '@/lib/queries';

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function ExploreScreen() {
  const theme = useTheme();
  const [text, setText] = useState('');
  const search = useDebounced(text.trim());

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <TabHeader title="Explorar" subtitle="Busca cualquier trámite o guía">
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Ej.: arraigo, NIE, apostilla…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text }]}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="never"
            accessibilityLabel="Buscar artículos"
          />
          {text.length > 0 && (
            <Pressable
              onPress={() => setText('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Borrar búsqueda">
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </TabHeader>

      {search.length >= 2 ? (
        <View style={styles.screen}>
          <PostList
            search={search}
            inTabs
            emptyTitle="Sin resultados"
            emptyMessage={`No encontramos artículos sobre «${search}». Prueba con otras palabras.`}
          />
        </View>
      ) : (
        <CategoryGrid />
      )}
    </View>
  );
}

function CategoryGrid() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { data, isPending, isError, refetch } = useCategories();
  const { width } = useWindowDimensions();
  // Dos columnas exactas: ancho útil menos márgenes laterales y el hueco central.
  const cellWidth = (Math.min(width, MaxContentWidth) - Spacing.three * 3) / 2;

  return (
    <ScrollView
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.gridContent,
        { paddingBottom: BottomTabInset + insets.bottom + Spacing.four },
      ]}>
      <ThemedText type="subtitle">Categorías</ThemedText>
      {isPending ? (
        <View style={styles.grid}>
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonBlock key={i} width={cellWidth} height={CARD_HEIGHT} radius={Radius.md} />
          ))}
        </View>
      ) : isError ? (
        <StateMessage
          icon="cloud-offline-outline"
          title="No se pudieron cargar las categorías"
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      ) : (
        <View style={styles.grid}>
          {data.map((category, index) => (
            <FadeUp key={category.id} index={index} style={{ width: cellWidth }}>
              <PressableScale
                onPress={() =>
                  router.push({ pathname: '/categoria/[slug]', params: { slug: category.slug } })
                }
                accessibilityRole="button"
                style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.cardIcon, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name="folder-open-outline" size={18} color={theme.primary} />
                </View>
                <ThemedText type="heading" numberOfLines={2}>
                  {category.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.cardCount}>
                  {category.count} {category.count === 1 ? 'artículo' : 'artículos'}
                </ThemedText>
              </PressableScale>
            </FadeUp>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const CARD_HEIGHT = 156;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  gridContent: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  card: {
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.one + 2,
    // Altura fija: todas las tarjetas iguales aunque el nombre ocupe una o dos líneas.
    height: CARD_HEIGHT,
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
  },
  cardCount: {
    marginTop: 'auto',
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
});
