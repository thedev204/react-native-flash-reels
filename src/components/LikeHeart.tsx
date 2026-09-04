import { useEffect, type ComponentType, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface LikeHeartProps {
  x: number;
  y: number;
  icon?: ReactNode;
  onFinished: () => void;
}

const HEART_SIZE = 96;

// RN 0.85 ViewStyle + Reanimated collide into unbounded type recursion when
// resolving Animated.View; erase the type at the boundary.
const AnimatedHeart = (
  Animated as unknown as {
    View: ComponentType<{
      style?: object;
      children?: ReactNode;
    }>;
  }
).View;

function DefaultHeart() {
  return (
    <View style={styles.defaultHeart}>
      <View style={styles.heartLeft} />
      <View style={styles.heartRight} />
    </View>
  );
}

/**
 * Brief scale+fade heart at the double-tap coordinates.
 * Timing is intentionally not configurable — keeps the public API lean.
 */
export function LikeHeart({ x, y, icon, onFinished }: LikeHeartProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 180, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1, { duration: 120 })
    );
    opacity.value = withTiming(0, {
      duration: 450,
      easing: Easing.in(Easing.quad),
    });

    const timeout = setTimeout(onFinished, 500);
    return () => clearTimeout(timeout);
  }, [onFinished, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: HEART_SIZE,
    height: HEART_SIZE,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      pointerEvents="none"
      style={[
        styles.anchor,
        { left: x - HEART_SIZE / 2, top: y - HEART_SIZE / 2 },
      ]}
    >
      <AnimatedHeart style={animatedStyle}>
        {icon ?? <DefaultHeart />}
      </AnimatedHeart>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    width: HEART_SIZE,
    height: HEART_SIZE,
    zIndex: 20,
  },
  defaultHeart: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Simple CSS-heart approximation so we don't ship an image asset.
  heartLeft: {
    position: 'absolute',
    width: 36,
    height: 56,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: '#ff2d55',
    left: 4,
    top: 0,
    transform: [{ rotate: '-45deg' }],
  },
  heartRight: {
    position: 'absolute',
    width: 36,
    height: 56,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: '#ff2d55',
    right: 4,
    top: 0,
    transform: [{ rotate: '45deg' }],
  },
});
