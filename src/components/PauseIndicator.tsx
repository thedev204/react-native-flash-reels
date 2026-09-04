import { useEffect, type ComponentType, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface PauseIndicatorProps {
  visible: boolean;
}

// Same Animated.View type erase as LikeHeart — RN 0.85 + Reanimated recurse.
const AnimatedBox = (
  Animated as unknown as {
    View: ComponentType<{ style?: object; children?: ReactNode }>;
  }
).View;

/**
 * Centered play glyph shown only while the active reel is user-paused.
 * Keeps playback state readable without owning overlay layout opinions.
 */
export function PauseIndicator({ visible }: PauseIndicatorProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 140 });
  }, [opacity, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View pointerEvents="none" style={styles.anchor}>
      <AnimatedBox style={[styles.badge, animatedStyle]}>
        <View style={styles.triangle} />
      </AnimatedBox>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  triangle: {
    width: 0,
    height: 0,
    borderTopWidth: 14,
    borderBottomWidth: 14,
    borderLeftWidth: 22,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
  },
});
