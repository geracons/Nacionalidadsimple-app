import { Easing, FadeInDown } from 'react-native-reanimated';

/**
 * Animación de entrada de tarjetas y elementos de lista: aparecen subiendo
 * unos pocos píxeles, sin rebote, escalonados según su posición.
 */
export function enterUp(index = 0) {
  return FadeInDown.delay(Math.min(index, 6) * 40)
    .duration(260)
    .easing(Easing.out(Easing.cubic))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] });
}
