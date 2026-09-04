import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface BufferingLoaderProps {
  visible: boolean;
}

/**
 * Centered spinner shown while the active reel is buffering.
 * Matches PauseIndicator overlay placement without owning feed layout.
 */
export function BufferingLoader({ visible }: BufferingLoaderProps) {
  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.anchor}>
      <View style={styles.badge}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
