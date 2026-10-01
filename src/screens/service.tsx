import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useLocalSearchParams } from 'expo-router';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContactButtons } from '@/components/contact-buttons';
import { FadeUp } from '@/components/fade-up';
import { HtmlContent } from '@/components/html/html-content';
import { PressableScale } from '@/components/pressable-scale';
import { SkeletonBlock } from '@/components/skeleton';
import { StateMessage } from '@/components/state-message';
import { ThemedText } from '@/components/themed-text';
import { SERVICES, type Service } from '@/config';
import { BottomTabInset, Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { isSamePage, openInAppBrowser, useOpenLink } from '@/hooks/use-open-link';
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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
        ]}>
        <View style={styles.hero}>
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
        </View>

        <View style={styles.body}>
          <View style={[styles.highlights, { backgroundColor: theme.backgroundElement }]}>
            {service.highlights.map((item) => (
              <View key={item} style={styles.highlight}>
                <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                <ThemedText style={styles.flex}>{item}</ThemedText>
              </View>
            ))}
          </View>

          {service.order && <OrderButton order={service.order} />}

          <ContactButtons
            whatsappMessage={service.whatsappMessage}
            emailSubject={`Solicitud: ${service.title}`}
          />

          {service.pageSlug && <ServicePage service={service} slug={service.pageSlug} />}

          {service.pageSlug && service.order && <OrderButton order={service.order} />}

          {service.pageSlug && (
            <ContactButtons
              whatsappMessage={service.whatsappMessage}
              emailSubject={`Solicitud: ${service.title}`}
            />
          )}
        </View>
      </ScrollView>

    </View>
  );
}

/** Botón principal: abre el formulario de solicitud con pago de la web dentro de la app. */
function OrderButton({ order }: { order: NonNullable<Service['order']> }) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={() => openInAppBrowser(order.url, theme)}
      accessibilityRole="button"
      style={[styles.orderButton, { backgroundColor: Brand.primary }]}>
      <Ionicons name="document-attach-outline" size={20} color="#fff" />
      <ThemedText type="heading" style={styles.orderText}>
        {order.label}
      </ThemedText>
      <Ionicons name="arrow-forward" size={18} color="#fff" />
    </PressableScale>
  );
}

/** Contenido de la página de WordPress del servicio, si existe. */
function ServicePage({ service, slug }: { service: Service; slug: string }) {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const openLink = useOpenLink();
  // Los botones de la página que llevan al formulario ("Apostillar YA") abren la solicitud.
  const onLinkPress = (href: string) => {
    if (service.order && (href.startsWith('#') || isSamePage(href, service.order.url))) {
      openInAppBrowser(service.order.url, theme);
    } else {
      openLink(href);
    }
  };
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
    <FadeUp>
      <HtmlContent
        html={data.html}
        featuredMediaId={data.featuredMediaId}
        width={Math.min(width, MaxContentWidth) - PADDING * 2}
        onLinkPress={onLinkPress}
      />
    </FadeUp>
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
  orderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two + 2,
    height: 56,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
  },
  orderText: {
    color: '#fff',
    flexShrink: 1,
  },
  skeleton: {
    gap: Spacing.two + 4,
  },
});
