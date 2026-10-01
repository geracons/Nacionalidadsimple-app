import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Visor de imágenes a pantalla completa (con zoom por pellizco en iOS). */
export function ImageViewer({ uri, onClose }: { uri?: string; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return (
    <Modal
      visible={Boolean(uri)}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={styles.content}
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}>
          <Pressable style={styles.content} onPress={onClose}>
            {uri && <Image source={{ uri }} style={{ width, height }} contentFit="contain" />}
          </Pressable>
        </ScrollView>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          style={[styles.close, { top: insets.top + 12 }]}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
  },
  content: {
    flexGrow: 1,
    width: '100%',
    justifyContent: 'center',
  },
  close: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
