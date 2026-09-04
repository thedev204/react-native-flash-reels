import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useFlashReels } from '../hooks/useFlashReels';

interface MuteButtonProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Optional pre-built mute toggle. Consumers can ignore this and build their
 * own with `useFlashReels().toggleMute`.
 */
export function MuteButton({ style }: MuteButtonProps) {
  const { isMuted, toggleMute } = useFlashReels();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
      onPress={toggleMute}
      style={[styles.button, style]}
      hitSlop={12}
    >
      <View style={styles.iconRow}>
        <View style={styles.speaker} />
        <View style={styles.cone} />
        {isMuted ? <View style={styles.slash} /> : <View style={styles.wave} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRow: {
    width: 22,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speaker: {
    position: 'absolute',
    left: 0,
    width: 6,
    height: 8,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  cone: {
    position: 'absolute',
    left: 5,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
  },
  wave: {
    position: 'absolute',
    right: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  slash: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: '#fff',
    transform: [{ rotate: '-40deg' }],
  },
});
