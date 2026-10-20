import type { ScrollDirection } from '../types';

/** Ignore offset churn smaller than this fraction of a page. */
const OFFSET_EPSILON_RATIO = 0.02;
/** Ignore velocity noise below this (px/ms-ish native units). */
const VELOCITY_EPSILON = 0.05;

export interface ScrollPredictionInput {
  offsetY: number;
  listHeight: number;
  dataLength: number;
  /** Native scroll velocityY when available (positive = scrolling down / forward). */
  velocityY?: number;
}

export interface ScrollPrediction {
  predictedIndex: number;
  direction: ScrollDirection;
}

/**
 * Predict the page the feed is heading toward during a fling.
 * Playback still settles via viewability; this biases prefetch and the
 * decoder mount window (union with activeIndex).
 */
export function predictScrollTarget(
  input: ScrollPredictionInput
): ScrollPrediction {
  const { offsetY, listHeight, dataLength, velocityY = 0 } = input;

  if (dataLength <= 0 || listHeight <= 0) {
    return { predictedIndex: 0, direction: 0 };
  }

  const maxIndex = dataLength - 1;
  const rawIndex = offsetY / listHeight;
  let predictedIndex = Math.round(rawIndex);

  // Bias toward the page in the velocity direction when mid-page.
  if (Math.abs(velocityY) > VELOCITY_EPSILON) {
    const frac = rawIndex - Math.floor(rawIndex);
    if (velocityY > 0 && frac > OFFSET_EPSILON_RATIO) {
      predictedIndex = Math.ceil(rawIndex);
    } else if (velocityY < 0 && frac < 1 - OFFSET_EPSILON_RATIO) {
      predictedIndex = Math.floor(rawIndex);
    }
  }

  predictedIndex = Math.max(0, Math.min(predictedIndex, maxIndex));

  let direction: ScrollDirection = 0;
  if (velocityY > VELOCITY_EPSILON) {
    direction = 1;
  } else if (velocityY < -VELOCITY_EPSILON) {
    direction = -1;
  } else {
    const delta = offsetY - predictedIndex * listHeight;
    if (delta > listHeight * OFFSET_EPSILON_RATIO) {
      direction = 1;
    } else if (delta < -listHeight * OFFSET_EPSILON_RATIO) {
      direction = -1;
    }
  }

  return { predictedIndex, direction };
}
