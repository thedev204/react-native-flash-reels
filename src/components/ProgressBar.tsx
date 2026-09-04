import type { ComponentType, ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

interface ProgressBarProps {
  /** 0–1 playback progress. */
  progress: SharedValue<number>;
  /** Style applied to the track (full-width bottom bar). */
  style?: StyleProp<ViewStyle>;
  /** When false, the bar stays mounted (for layout) but is hidden. */
  visible?: boolean;
}

// Same Animated.View type erase as PauseIndicator / LikeHeart.
const AnimatedBox = (
  Animated as unknown as {
    View: ComponentType<{ style?: object; children?: ReactNode }>;
  }
).View;

/**
 * Thin Instagram-style scrubber track at the bottom of a reel.
 * Display-only — seeking is intentionally not handled here.
 *
 * Uses a measured track width + pixel fill width. Percentage widths inside
 * `useAnimatedStyle` are unreliable on Fabric / New Architecture.
 */
export function ProgressBar({
  progress,
  style,
  visible = true,
}: ProgressBarProps) {
  const trackWidth = useSharedValue(0);

  const fillStyle = useAnimatedStyle(() => ({
    width: trackWidth.value * Math.min(1, Math.max(0, progress.value)),
  }));

  return (
    <View
      pointerEvents="none"
      style={[styles.track, style, !visible && styles.hidden]}
      onLayout={(event) => {
        trackWidth.value = event.nativeEvent.layout.width;
      }}
    >
      <AnimatedBox style={[styles.fill, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    zIndex: 12,
    overflow: 'hidden',
  },
  hidden: {
    opacity: 0,
  },
  fill: {
    height: '100%',
    backgroundColor: '#fff',
  },
});
