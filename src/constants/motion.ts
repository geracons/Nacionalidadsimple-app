import { Easing, Keyframe } from 'react-native-reanimated';

const fadeUp = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 8 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.out(Easing.cubic) },
});

/**
 * Animación de entrada de tarjetas y elementos de lista: aparecen subiendo
 * unos pocos píxeles, sin rebote, escalonados según su posición.
 */
export function enterUp(index = 0) {
  return fadeUp.duration(260).delay(Math.min(index, 6) * 40);
}
