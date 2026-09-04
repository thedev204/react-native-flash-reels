import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

interface UseDoubleTapOptions {
  onSingleTap: () => void;
  onDoubleTap: (x: number, y: number) => void;
}

/**
 * Race a double-tap against a single-tap so pause/play still feels instant
 * on single taps — Gesture Handler waits for the double-tap window only when
 * a second tap is possible, not on every interaction.
 *
 * Composed Simultaneous with Gesture.Native() so the parent FlashList can
 * still claim vertical pans — without that, taps fight the scroll and paging
 * feels sticky / high-effort.
 */
export function useDoubleTap({
  onSingleTap,
  onDoubleTap,
}: UseDoubleTapOptions) {
  return useMemo(() => {
    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(250)
      // Cancel the tap as soon as the finger clearly starts a scroll.
      .maxDistance(12)
      .onEnd((event) => {
        'worklet';
        runOnJS(onDoubleTap)(event.x, event.y);
      });

    const singleTap = Gesture.Tap()
      .numberOfTaps(1)
      .maxDistance(12)
      .onEnd(() => {
        'worklet';
        runOnJS(onSingleTap)();
      });

    const taps = Gesture.Exclusive(doubleTap, singleTap);
    const nativeScroll = Gesture.Native();

    return Gesture.Simultaneous(nativeScroll, taps);
  }, [onSingleTap, onDoubleTap]);
}
