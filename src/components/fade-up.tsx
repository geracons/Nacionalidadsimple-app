import { useEffect, type PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

type Props = PropsWithChildren<{
  /** Posición en la lista, para escalonar la entrada. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Aparece subiendo unos pocos píxeles, sin rebote.
 * Se hace con un estilo animado (no con `entering`) para que el elemento
 * nunca salga del flujo del layout mientras se anima.
 */
export function FadeUp({ index = 0, style, children }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withDelay(
        Math.min(index, 6) * 40,
        withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) })
      )
    );
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
