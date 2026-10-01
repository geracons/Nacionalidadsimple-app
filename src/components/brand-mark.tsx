import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

/**
 * Logotipo provisional (iniciales). Sustituir por el logo real:
 * <Image source={require('@/assets/images/logo.png')} style={{ width: size, height: size }} />
 */
export function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <View
      style={[
        styles.mark,
        { width: size, height: size, borderRadius: size * 0.3, backgroundColor: Brand.primary },
      ]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>NS</Text>
      <View style={[styles.dot, { width: size * 0.2, height: size * 0.2, borderRadius: size }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'continuous',
  },
  text: {
    color: '#fff',
    fontWeight: 900,
    letterSpacing: -0.5,
  },
  dot: {
    position: 'absolute',
    right: '14%',
    top: '14%',
    backgroundColor: Brand.accent,
  },
});
