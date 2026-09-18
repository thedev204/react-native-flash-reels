import type { InitialQuality, ReelData, ReelQuality } from '../types';

function qualityScore(q: ReelQuality): number {
  if (q.bandwidth != null && Number.isFinite(q.bandwidth)) {
    return q.bandwidth;
  }
  if (q.height != null && Number.isFinite(q.height)) {
    return q.height;
  }
  if (q.width != null && Number.isFinite(q.width)) {
    return q.width;
  }
  return 0;
}

function sortedByScore(qualities: ReelQuality[]): ReelQuality[] {
  return [...qualities].sort((a, b) => qualityScore(a) - qualityScore(b));
}

/**
 * Pick a playback URI from `videoUri` / optional `qualities`.
 * `auto` prefers the lowest rung for a fast first paint (Instagram-like).
 */
export function resolveVideoUri<T extends ReelData>(
  item: T,
  initialQuality: InitialQuality = 'auto',
  customResolve?: (item: T) => string
): string {
  if (customResolve) {
    return customResolve(item);
  }

  const ladder = item.qualities;
  if (ladder == null || ladder.length === 0) {
    return item.videoUri;
  }

  const sorted = sortedByScore(ladder);
  if (initialQuality === 'low') {
    return sorted[0]?.uri ?? item.videoUri;
  }
  if (initialQuality === 'high') {
    return sorted[sorted.length - 1]?.uri ?? item.videoUri;
  }
  // auto — lowest for fast start
  return sorted[0]?.uri ?? item.videoUri;
}
