jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');

  const useSharedValue = (init: unknown) => ({ value: init });
  const useAnimatedStyle = (fn: () => object) => fn();
  const withTiming = (toValue: unknown) => toValue;
  const withSequence = (...vals: unknown[]) => vals[vals.length - 1];
  const cancelAnimation = () => {};
  const Easing = {
    out: (e: unknown) => e,
    in: (e: unknown) => e,
    linear: {},
    back: () => ({}),
    quad: {},
  };
  const runOnJS = (fn: (...args: unknown[]) => unknown) => fn;

  return {
    __esModule: true,
    default: {
      View,
      call: () => {},
      createAnimatedComponent: (Component: unknown) => Component,
    },
    View,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    cancelAnimation,
    Easing,
    runOnJS,
  };
});

jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');

  const chainable = () => {
    const gesture: Record<string, unknown> = {};
    const methods = [
      'numberOfTaps',
      'maxDuration',
      'maxDistance',
      'onEnd',
      'disallowInterruption',
    ];
    for (const method of methods) {
      gesture[method] = () => gesture;
    }
    return gesture;
  };

  return {
    GestureHandlerRootView: View,
    GestureDetector: ({ children }: { children: unknown }) => children,
    Gesture: {
      Tap: () => chainable(),
      Native: () => chainable(),
      Exclusive: (...gestures: unknown[]) => gestures[0],
      Simultaneous: (...gestures: unknown[]) => gestures[0],
    },
  };
});

jest.mock('react-native-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef((props: object, ref: unknown) =>
      React.createElement(View, { ...props, ref, testID: 'mock-video' })
    ),
  };
});

jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const { FlatList } = require('react-native');
  return {
    FlashList: React.forwardRef((props: object, ref: unknown) =>
      React.createElement(FlatList, { ...props, ref })
    ),
  };
});

// Silence Reanimated / RNGH noisy logs in tests.
jest.spyOn(console, 'warn').mockImplementation(() => {});
