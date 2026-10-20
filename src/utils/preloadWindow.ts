import type { PreloadStrategy, ScrollDirection } from '../types';

/**
 * Only the active item and a small neighborhood should hold a real video
 * source. Everything else stays poster-only so we don't exhaust hardware
 * decoders (especially limited on Android).
 */
export function isWithinPreloadWindow(
  index: number,
  activeIndex: number,
  windowSize: number
): boolean {
  return Math.abs(index - activeIndex) <= windowSize;
}

/**
 * Directional decoder window: more slots ahead of scroll than behind
 * (mirrors directional prefetch — ahead = windowSize, behind = floor(window/2)).
 * Active index always loads.
 */
export function isWithinDirectionalPreloadWindow(
  index: number,
  activeIndex: number,
  windowSize: number,
  direction: ScrollDirection = 1
): boolean {
  if (index === activeIndex) {
    return true;
  }
  if (windowSize <= 0) {
    return false;
  }

  const forward = direction < 0 ? -1 : 1;
  const delta = index - activeIndex;
  const aheadCount = windowSize;
  const behindCount = Math.max(0, Math.floor(windowSize / 2));

  if (forward === 1) {
    if (delta > 0) {
      return delta <= aheadCount;
    }
    return -delta <= behindCount;
  }

  // scrolling backward — "ahead" is lower indexes
  if (delta < 0) {
    return -delta <= aheadCount;
  }
  return delta <= behindCount;
}

export function shouldLoadReel(
  index: number,
  activeIndex: number,
  windowSize: number,
  strategy: PreloadStrategy = 'symmetric',
  direction: ScrollDirection = 1
): boolean {
  if (strategy === 'directional') {
    return isWithinDirectionalPreloadWindow(
      index,
      activeIndex,
      windowSize,
      direction
    );
  }
  return isWithinPreloadWindow(index, activeIndex, windowSize);
}

/**
 * Union of decoder windows around settled + predicted indices so flings can
 * mount the landing page before viewability catches up. Playback ownership
 * stays on the settled active index.
 */
export function shouldLoadReelAround(
  index: number,
  centers: ReadonlyArray<number>,
  windowSize: number,
  strategy: PreloadStrategy = 'symmetric',
  direction: ScrollDirection = 1
): boolean {
  for (let i = 0; i < centers.length; i += 1) {
    const center = centers[i];
    if (center == null) {
      continue;
    }
    if (shouldLoadReel(index, center, windowSize, strategy, direction)) {
      return true;
    }
  }
  return false;
}
