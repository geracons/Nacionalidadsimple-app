import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Escala al pulsar (0.985 por defecto). */
  activeScale?: number;
};

/** Botón que se "hunde" ligeramente al pulsarlo (sin rebote). */
export function PressableScale({ style, activeScale = 0.985, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={(event) => {
        scale.set(withTiming(activeScale, { duration: 90, easing: Easing.out(Easing.quad) }));
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) }));
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    />
  );
}
