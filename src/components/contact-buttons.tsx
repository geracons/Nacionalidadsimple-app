import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { openEmail, openWhatsApp } from '@/lib/contact';

const WHATSAPP_GREEN = '#25D366';

type Props = {
  whatsappMessage: string;
  emailSubject: string;
};

/** Botones de contacto: WhatsApp (principal) y email (secundario). */
export function ContactButtons({ whatsappMessage, emailSubject }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <PressableScale
        onPress={() => openWhatsApp(whatsappMessage)}
        accessibilityRole="button"
        style={[styles.button, styles.primary]}>
        <Ionicons name="logo-whatsapp" size={20} color="#fff" />
        <ThemedText type="smallBold" style={styles.primaryText}>
          WhatsApp
        </ThemedText>
      </PressableScale>
      <PressableScale
        onPress={() => openEmail(emailSubject)}
        accessibilityRole="button"
        style={[
          styles.button,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 },
        ]}>
        <Ionicons name="mail-outline" size={20} color={theme.text} />
        <ThemedText type="smallBold">Email</ThemedText>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two + 4,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 52,
    borderRadius: Radius.pill,
  },
  primary: {
    backgroundColor: WHATSAPP_GREEN,
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
  },
});
