import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContactButtons } from '@/components/contact-buttons';
import { FadeUp } from '@/components/fade-up';
import { PressableScale } from '@/components/pressable-scale';
import { TabHeader } from '@/components/tab-header';
import { ThemedText } from '@/components/themed-text';
import { CONTACT, SERVICES } from '@/config';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ServicesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: BottomTabInset + insets.bottom + Spacing.four },
      ]}>
      <TabHeader title="Servicios" subtitle="Nos encargamos del papeleo por ti" />

      <View style={styles.list}>
        {SERVICES.map((service, index) => (
          <FadeUp key={service.id} index={index}>
            <PressableScale
              onPress={() => router.push({ pathname: '/servicio/[id]', params: { id: service.id } })}
              accessibilityRole="button"
              style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <View style={[styles.icon, { backgroundColor: theme.primarySoft }]}>
                <Ionicons
                  name={service.icon as ComponentProps<typeof Ionicons>['name']}
                  size={24}
                  color={theme.primary}
                />
              </View>
              <View style={styles.texts}>
                <ThemedText type="heading">{service.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {service.summary}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </PressableScale>
          </FadeUp>
        ))}
      </View>

      <FadeUp
        index={SERVICES.length}
        style={[styles.contact, { backgroundColor: theme.primarySoft }]}>
        <ThemedText type="subtitle">¿Tienes dudas?</ThemedText>
        <ThemedText themeColor="textSecondary">
          Escríbenos y te decimos qué necesitas para tu trámite, sin compromiso.
        </ThemedText>
        <ThemedText type="smallBold" themeColor="textSecondary">
          WhatsApp {CONTACT.whatsappDisplay} · {CONTACT.email}
        </ThemedText>
        <ContactButtons
          whatsappMessage="Hola, tengo una consulta sobre un trámite de extranjería."
          emailSubject="Consulta desde la app"
        />
      </FadeUp>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  list: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two + 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.05)',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  contact: {
    margin: Spacing.three,
    marginTop: Spacing.four,
    padding: Spacing.four - 4,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    gap: Spacing.two,
  },
});
