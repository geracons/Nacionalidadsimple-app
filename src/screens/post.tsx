import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Platform, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type DerivedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { BrandMark } from '@/components/brand-mark';
import { ContactButtons } from '@/components/contact-buttons';
import { HtmlContent } from '@/components/html/html-content';
import { PostCard } from '@/components/post-card';
import { PressableScale } from '@/components/pressable-scale';
import { SkeletonBlock } from '@/components/skeleton';
import { StateMessage } from '@/components/state-message';
import { ThemedText } from '@/components/themed-text';
import { WP_URL } from '@/config';
import { BottomTabInset, Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useOpenLink } from '@/hooks/use-open-link';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useCachedSummary } from '@/lib/cache';
import { useFavorites } from '@/lib/favorites';
import { usePost, usePosts } from '@/lib/queries';
import { formatDate } from '@/lib/text';
import type { PostSummary } from '@/lib/wp';

const FONT_SCALES = [1, 1.12, 1.25, 0.92];
// Se recuerda durante la sesión al pasar de un artículo a otro.
let lastFontScaleIndex = 0;

const SHEET_OVERLAP = 28;
const PADDING = Spacing.three + 4;

export default function PostScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const openLink = useOpenLink();
  const { isFavorite, toggleFavorite } = useFavorites();

  const query = usePost(slug);
  const cached = useCachedSummary(slug);
  const post = query.data;
  const summary: PostSummary | undefined = post ?? cached;

  const [fontScaleIndex, setFontScaleIndex] = useState(lastFontScaleIndex);
  const fontScale = FONT_SCALES[fontScaleIndex];

  const hasImage = Boolean(summary?.image);
  const heroHeight = hasImage ? Math.min(Math.round(width * 0.78), 420) : insets.top + 96;
  const contentWidth = Math.min(width, MaxContentWidth) - PADDING * 2;

  // ---- Animaciones ligadas al scroll ----
  const scrollY = useSharedValue(0);
  const contentHeight = useSharedValue(1);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
    contentHeight.value = event.contentSize.height - event.layoutMeasurement.height;
  });

  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-heroHeight, 0, heroHeight],
          [-heroHeight / 2, 0, heroHeight * 0.6],
          Extrapolation.CLAMP
        ),
      },
      {
        scale: interpolate(scrollY.value, [-heroHeight, 0], [2, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  // 0 = cabecera transparente sobre la imagen, 1 = barra sólida con título.
  const barProgress = useDerivedValue(() =>
    interpolate(
      scrollY.value,
      [heroHeight - insets.top - 110, heroHeight - insets.top - 50],
      [0, 1],
      Extrapolation.CLAMP
    )
  );
  const barStyle = useAnimatedStyle(() => ({ opacity: barProgress.value }));

  // Iconos de la barra de estado en blanco mientras se ve la imagen.
  const scheme = useColorScheme();
  const [overHero, setOverHero] = useState(true);
  useAnimatedReaction(
    () => barProgress.value < 0.5,
    (isOver, previous) => {
      if (isOver !== previous) scheduleOnRN(setOverHero, isOver);
    }
  );
  const statusBarStyle = overHero || scheme === 'dark' ? 'light' : 'dark';

  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(scrollY.value, [0, Math.max(contentHeight.value, 1)], [0, 100], Extrapolation.CLAMP)}%`,
  }));

  // ---- Acciones ----
  const link = summary?.link ?? `${WP_URL}/${slug}/`;
  const saved = isFavorite(slug);

  const onShare = () => {
    Share.share(
      Platform.OS === 'ios'
        ? { message: summary?.title, url: link }
        : { message: summary ? `${summary.title}\n${link}` : link, title: summary?.title }
    ).catch(() => {});
  };

  const onToggleSave = () => {
    if (!summary) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggleFavorite(summary);
  };

  const onFontScale = () => {
    const next = (fontScaleIndex + 1) % FONT_SCALES.length;
    lastFontScaleIndex = next;
    Haptics.selectionAsync().catch(() => {});
    setFontScaleIndex(next);
  };

  if (!summary && query.isError) {
    return (
      <View style={[styles.screen, styles.center, { backgroundColor: theme.background }]}>
        <StateMessage
          icon="alert-circle-outline"
          title="No se pudo abrir el artículo"
          message={query.error.message}
          actionLabel="Abrir en la web"
          onAction={() => openLink(`${WP_URL}/${slug}/`)}
        />
        <TopBar
          insetsTop={insets.top}
          barProgress={barProgress}
          onBack={() => router.back()}
          solid
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <StatusBar style={statusBarStyle} animated />
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never">
        {/* Imagen con parallax */}
        <Animated.View style={[{ height: heroHeight }, heroStyle]}>
          {hasImage ? (
            <Image
              source={{ uri: summary?.image?.url }}
              placeholder={{ uri: summary?.image?.thumbUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
              accessibilityLabel={summary?.image?.alt}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.heroFallback]}>
              <BrandMark size={44} />
            </View>
          )}
        </Animated.View>

        {/* Hoja de contenido que se superpone a la imagen */}
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.background, minHeight: height - heroHeight + SHEET_OVERLAP },
          ]}>
          <View style={[styles.inner, { maxWidth: MaxContentWidth }]}>
            {summary ? (
              <PostHeader summary={summary} readingMinutes={post?.readingMinutes} author={post?.author} />
            ) : (
              <View style={styles.headerSkeleton}>
                <SkeletonBlock width="30%" height={14} />
                <SkeletonBlock height={28} />
                <SkeletonBlock width="75%" height={28} />
              </View>
            )}

            {post ? (
              <Animated.View entering={FadeIn.duration(250)}>
                <HtmlContent
                  html={post.html}
                  featuredMediaId={post.featuredMediaId}
                  width={contentWidth}
                  fontScale={fontScale}
                  onLinkPress={openLink}
                />
              </Animated.View>
            ) : query.isError ? (
              <StateMessage
                icon="cloud-offline-outline"
                title="No se pudo cargar el contenido"
                message={query.error.message}
                actionLabel="Reintentar"
                onAction={() => query.refetch()}
              />
            ) : (
              <ContentSkeleton />
            )}

            {post && (
              <>
                <View style={[styles.helpCard, { backgroundColor: theme.primarySoft }]}>
                  <ThemedText type="heading">¿Te ayudamos con este trámite?</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Cuéntanos tu caso y te decimos cómo hacerlo, paso a paso.
                  </ThemedText>
                  <ContactButtons
                    whatsappMessage={`Hola, he leído «${post.title}» y quería consultar mi caso.`}
                    emailSubject={`Consulta: ${post.title}`}
                  />
                </View>

                <PressableScale
                  onPress={() => openLink(link)}
                  style={[styles.webLink, { borderColor: theme.border }]}
                  accessibilityRole="link">
                  <Ionicons name="globe-outline" size={18} color={theme.primary} />
                  <ThemedText type="link">Ver en la web</ThemedText>
                </PressableScale>

                <RelatedPosts post={post} />
              </>
            )}
          </View>
          <View style={{ height: insets.bottom + BottomTabInset + Spacing.four }} />
        </View>
      </Animated.ScrollView>

      {/* Barra superior: transparente sobre la imagen, sólida al hacer scroll */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bar,
          { height: insets.top + 56, backgroundColor: theme.background, borderBottomColor: theme.border },
          barStyle,
        ]}>
        <ThemedText
          type="heading"
          numberOfLines={1}
          style={[styles.barTitle, { marginTop: insets.top }]}>
          {summary?.title}
        </ThemedText>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progress, { backgroundColor: theme.primary }, progressStyle]} />
        </View>
      </Animated.View>

      <TopBar
        insetsTop={insets.top}
        barProgress={barProgress}
        onBack={() => router.back()}
        actions={[
          { icon: 'text', label: 'Tamaño de letra', onPress: onFontScale },
          { icon: 'share-outline', label: 'Compartir', onPress: onShare },
          {
            icon: saved ? 'bookmark' : 'bookmark-outline',
            label: saved ? 'Quitar de guardados' : 'Guardar',
            onPress: onToggleSave,
          },
        ]}
      />
    </View>
  );
}

// ---------- Subcomponentes ----------

function PostHeader({
  summary,
  readingMinutes,
  author,
}: {
  summary: PostSummary;
  readingMinutes?: number;
  author?: string;
}) {
  const theme = useTheme();
  const meta = [
    summary.type === 'post' ? formatDate(new Date(summary.date)) : undefined,
    readingMinutes ? `${readingMinutes} min de lectura` : undefined,
    author,
  ].filter(Boolean);

  return (
    <View style={styles.header}>
      {summary.categories.length > 0 && (
        <View style={styles.categories}>
          {summary.categories.slice(0, 3).map((category) => (
            <PressableScale
              key={category.id}
              onPress={() =>
                router.push({ pathname: '/categoria/[slug]', params: { slug: category.slug } })
              }
              style={[styles.category, { backgroundColor: theme.primarySoft }]}>
              <ThemedText type="caption" themeColor="primary">
                {category.name}
              </ThemedText>
            </PressableScale>
          ))}
        </View>
      )}
      <ThemedText type="title" selectable style={styles.title}>
        {summary.title}
      </ThemedText>
      {meta.length > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          {meta.join('  ·  ')}
        </ThemedText>
      )}
      <View style={[styles.divider, { backgroundColor: theme.border }]} />
    </View>
  );
}

function ContentSkeleton() {
  return (
    <View style={styles.contentSkeleton}>
      {[100, 95, 98, 60, 0, 100, 92, 97, 40].map((w, i) =>
        w === 0 ? (
          <View key={i} style={{ height: Spacing.three }} />
        ) : (
          <SkeletonBlock key={i} width={`${w}%`} height={16} />
        )
      )}
    </View>
  );
}

function RelatedPosts({ post }: { post: PostSummary }) {
  const category = post.categories[0];
  const { data } = usePosts({ category: category?.id });
  const related = (data?.pages[0]?.posts ?? []).filter((item) => item.id !== post.id).slice(0, 3);
  if (!category || related.length === 0) return null;

  return (
    <View style={styles.related}>
      <ThemedText type="subtitle">Sigue leyendo</ThemedText>
      {related.map((item, index) => (
        <PostCard key={item.id} post={item} index={index} />
      ))}
    </View>
  );
}

type Action = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
};

function TopBar({
  insetsTop,
  barProgress,
  onBack,
  actions = [],
  solid = false,
}: {
  insetsTop: number;
  barProgress: DerivedValue<number>;
  onBack: () => void;
  actions?: Action[];
  solid?: boolean;
}) {
  return (
    <View style={[styles.topBar, { top: insetsTop + 6 }]} pointerEvents="box-none">
      <HeaderButton
        icon={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
        label="Volver"
        onPress={onBack}
        progress={barProgress}
        solid={solid}
      />
      <View style={styles.topActions}>
        {actions.map((action) => (
          <HeaderButton key={action.label} {...action} progress={barProgress} solid={solid} />
        ))}
      </View>
    </View>
  );
}

/** Botón circular: blanco sobre la imagen; con el color del tema cuando la barra es sólida. */
function HeaderButton({
  icon,
  label,
  onPress,
  progress,
  solid,
}: Action & { progress: DerivedValue<number>; solid: boolean }) {
  const theme = useTheme();
  const overImage = useAnimatedStyle(() => ({ opacity: solid ? 0 : 1 - progress.value }));
  const overBar = useAnimatedStyle(() => ({ opacity: solid ? 1 : progress.value }));

  return (
    <PressableScale
      onPress={onPress}
      hitSlop={6}
      activeScale={0.88}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.headerButton}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.headerButtonDark, overImage]}>
        <Ionicons name={icon} size={21} color="#fff" />
      </Animated.View>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          styles.headerButtonLight,
          { backgroundColor: theme.backgroundElement },
          overBar,
        ]}>
        <Ionicons name={icon} size={21} color={theme.text} />
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
  },
  heroFallback: {
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: SHEET_OVERLAP + Spacing.three,
  },
  sheet: {
    marginTop: -SHEET_OVERLAP,
    borderTopLeftRadius: SHEET_OVERLAP,
    borderTopRightRadius: SHEET_OVERLAP,
    paddingTop: Spacing.four,
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: PADDING,
  },
  header: {
    gap: Spacing.two + 2,
    marginBottom: Spacing.four,
  },
  headerSkeleton: {
    gap: Spacing.two + 2,
    marginBottom: Spacing.four,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  category: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 1,
    borderRadius: Radius.pill,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  divider: {
    height: StyleSheet.hairlineWidth * 2,
    marginTop: Spacing.two,
  },
  contentSkeleton: {
    gap: Spacing.two + 4,
  },
  helpCard: {
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    padding: Spacing.four - 4,
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  webLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 50,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: Spacing.three,
  },
  related: {
    gap: Spacing.three,
    marginTop: Spacing.five,
  },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  barTitle: {
    // Deja sitio al botón de volver (izq.) y a los tres botones de acción (dcha.).
    marginLeft: 40 + Spacing.three * 2,
    marginRight: 40 * 3 + Spacing.two * 2 + Spacing.three * 2,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
  },
  progress: {
    height: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  topBar: {
    position: 'absolute',
    left: Spacing.three - 4,
    right: Spacing.three - 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  headerButton: {
    width: 40,
    height: 40,
  },
  headerButtonDark: {
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonLight: {
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
