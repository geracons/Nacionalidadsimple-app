import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { BrandFonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MARK_RATIO = 331 / 450;
const FLAG_RATIO = 56 / 38;

/** Ilustración de la Sagrada Familia del logo. */
export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <Image
      source={require('@/assets/images/logo-mark.png')}
      style={{ width: size * MARK_RATIO, height: size }}
      contentFit="contain"
      accessibilityLabel="Nacionalidad Simple"
    />
  );
}

/**
 * Logotipo "bandera + nacionalidadsimple.com". El nombre se dibuja como texto
 * (con la tipografía del logo) para que se vea nítido en cualquier pantalla.
 */
export function Wordmark({ height = 22, color }: { height?: number; color?: string }) {
  const theme = useTheme();
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="header"
      accessibilityLabel="nacionalidadsimple.com">
      <Image
        source={require('@/assets/images/flag-es.png')}
        style={{ width: height * FLAG_RATIO, height }}
        contentFit="contain"
      />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          styles.text,
          { color: color ?? theme.text, fontSize: height * 1.04, marginLeft: height * 0.3 },
        ]}>
        nacionalidadsimple.com
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  text: {
    fontFamily: BrandFonts.extraBold,
    letterSpacing: -0.5,
    flexShrink: 1,
    includeFontPadding: false,
  },
});
