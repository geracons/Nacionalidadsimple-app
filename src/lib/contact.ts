import { Linking } from 'react-native';

import { CONTACT } from '@/config';

export function openWhatsApp(message: string) {
  const url = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(message)}`;
  return Linking.openURL(url).catch(() => {});
}

export function openEmail(subject: string) {
  const url = `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`;
  return Linking.openURL(url).catch(() => {});
}
