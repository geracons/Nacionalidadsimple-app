import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContactButtons } from '@/components/contact-buttons';
import { HtmlContent } from '@/components/html/html-content';
import { SkeletonBlock } from '@/components/skeleton';
import { StateMessage } from '@/components/state-message';
import { ThemedText } from '@/components/themed-text';
import { SERVICES, type Service } from '@/config';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useOpenLink } from '@/hooks/use-open-link';
import { useTheme } from '@/hooks/use-theme';
import { usePost } from '@/lib/queries';

const PADDING = Spacing.three + 4;

export default function ServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const service = SERVICES.find((item) => item.id === id);

  if (!service) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background }]}>
        <StateMessage icon="briefcase-outline" title="Servicio no encontrado" />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Servicio' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.springify().damping(18)} style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={service.icon as ComponentProps<typeof Ionicons>['name']}
              size={30}
              color="#fff"
            />
          </View>
          <ThemedText type="title" style={styles.heroText}>
            {service.title}
          </ThemedText>
          <ThemedText style={[styles.heroText, { opacity: 0.85 }]}>{service.summary}</ThemedText>
        </Animated.View>

        <View style={styles.body}>
          <Animated.View
            entering={FadeInDown.delay(80).springify().damping(18)}
            style={[styles.highlights, { backgroundColor: theme.backgroundElement }]}>
            {service.highlights.map((item) => (
              <View key={item} style={styles.highlight}>
                <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                <ThemedText style={styles.flex}>{item}</ThemedText>
              </View>
            ))}
          </Animated.View>

          {service.pageSlug && <ServicePage slug={service.pageSlug} />}
        </View>
      </ScrollView>

      {/* Botones de contacto fijos abajo */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + Spacing.three,
            backgroundColor: theme.background,
            borderTopColor: theme.border,
          },
        ]}>
        <ContactButtons
          whatsappMessage={service.whatsappMessage}
          emailSubject={`Solicitud: ${service.title}`}
        />
      </View>
    </View>
  );
}

/** Contenido de la página de WordPress del servicio, si existe. */
function ServicePage({ slug }: { slug: NonNullable<Service['pageSlug']> }) {
  const { width } = useWindowDimensions();
  const openLink = useOpenLink();
  const { data, isPending, isError } = usePost(slug);

  if (isPending) {
    return (
      <View style={styles.skeleton}>
        {[100, 94, 97, 55].map((w) => (
          <SkeletonBlock key={w} width={`${w}%`} height={16} />
        ))}
      </View>
    );
  }
  // Si la página no existe todavía en la web simplemente no se muestra nada.
  if (isError || !data) return null;

  return (
    <Animated.View entering={FadeIn.duration(250)}>
      <HtmlContent
        html={data.html}
        width={Math.min(width, MaxContentWidth) - PADDING * 2}
        onLinkPress={openLink}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingBottom: 140,
  },
  hero: {
    margin: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    backgroundColor: Brand.primary,
    gap: Spacing.two,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  heroText: {
    color: '#fff',
  },
  body: {
    paddingHorizontal: PADDING,
    gap: Spacing.four,
  },
  highlights: {
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  highlight: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
    alignItems: 'flex-start',
  },
  skeleton: {
    gap: Spacing.two + 4,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
