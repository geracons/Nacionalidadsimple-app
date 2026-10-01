import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Escala al pulsar (0.97 por defecto). */
  activeScale?: number;
};

/** Botón que se "hunde" ligeramente al pulsarlo, con muelle nativo. */
export function PressableScale({ style, activeScale = 0.97, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        scale.set(withSpring(activeScale, { damping: 20, stiffness: 400 }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withSpring(1, { damping: 15, stiffness: 300 }));
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    />
  );
}
