import { Image } from 'react-native';
import type { InitialQuality, PrefetchStrategy, ReelData } from '../types';
import { resolveVideoUri } from './resolveVideoUri';

/** Bytes requested to warm CDN / OS HTTP cache without a full download. */
const VIDEO_HINT_RANGE_END = 65_535;

export type ScrollDirection = 1 | -1 | 0;

/**
 * Indexes to warm for HTTP/poster prefetch (not decoder mounts).
 * `directional` puts more slots ahead of scroll than behind.
 */
export function getPrefetchIndexes(
  activeIndex: number,
  dataLength: number,
  windowSize: number,
  strategy: PrefetchStrategy,
  direction: ScrollDirection = 1
): number[] {
  if (dataLength <= 0 || windowSize <= 0) {
    return [];
  }

  const clampedActive = Math.max(0, Math.min(activeIndex, dataLength - 1));
  const indexes = new Set<number>();

  if (strategy === 'symmetric') {
    for (let i = 1; i <= windowSize; i++) {
      const ahead = clampedActive + i;
      const behind = clampedActive - i;
      if (ahead < dataLength) {
        indexes.add(ahead);
      }
      if (behind >= 0) {
        indexes.add(behind);
      }
    }
    return [...indexes].sort((a, b) => a - b);
  }

  // directional: bias ahead of scroll (default forward = +1)
  const forward = direction < 0 ? -1 : 1;
  const aheadCount = windowSize;
  const behindCount = Math.max(0, Math.floor(windowSize / 2));

  for (let i = 1; i <= aheadCount; i++) {
    const idx = clampedActive + forward * i;
    if (idx >= 0 && idx < dataLength) {
      indexes.add(idx);
    }
  }
  for (let i = 1; i <= behindCount; i++) {
    const idx = clampedActive - forward * i;
    if (idx >= 0 && idx < dataLength) {
      indexes.add(idx);
    }
  }

  return [...indexes].sort((a, b) => a - b);
}

/** Sort indexes so higher `prefetchPriority` runs first. */
export function sortIndexesByPrefetchPriority<T extends ReelData>(
  indexes: number[],
  data: readonly T[]
): number[] {
  return [...indexes].sort((a, b) => {
    const pa = data[a]?.prefetchPriority ?? 0;
    const pb = data[b]?.prefetchPriority ?? 0;
    if (pb !== pa) {
      return pb - pa;
    }
    return a - b;
  });
}

const warmedPosters = new Set<string>();
const inFlightPosters = new Set<string>();
const warmedVideos = new Set<string>();
const inFlightVideos = new Set<string>();

/** Test helper — clears module-level dedupe sets. */
export function resetPrefetchState(): void {
  warmedPosters.clear();
  inFlightPosters.clear();
  warmedVideos.clear();
  inFlightVideos.clear();
}

export function prefetchPosters(uris: readonly string[]): void {
  for (const uri of uris) {
    if (!uri || warmedPosters.has(uri) || inFlightPosters.has(uri)) {
      continue;
    }
    inFlightPosters.add(uri);
    Image.prefetch(uri)
      .then(() => {
        warmedPosters.add(uri);
      })
      .catch(() => {
        // Soft-fail — next swipe can retry.
      })
      .finally(() => {
        inFlightPosters.delete(uri);
      });
  }
}

async function warmVideoUri(uri: string): Promise<void> {
  try {
    const response = await fetch(uri, {
      method: 'GET',
      headers: {
        Range: `bytes=0-${VIDEO_HINT_RANGE_END}`,
      },
    });
    // Drain a little so some runtimes actually complete the Range request.
    await response.arrayBuffer();
  } catch {
    try {
      await fetch(uri, { method: 'HEAD' });
    } catch {
      // Soft-fail — decoder preload / playback still work.
    }
  }
}

export function prefetchVideoHints(uris: readonly string[]): void {
  for (const uri of uris) {
    if (!uri || warmedVideos.has(uri) || inFlightVideos.has(uri)) {
      continue;
    }
    inFlightVideos.add(uri);
    warmVideoUri(uri)
      .then(() => {
        warmedVideos.add(uri);
      })
      .finally(() => {
        inFlightVideos.delete(uri);
      });
  }
}

export function runFeedPrefetch<T extends ReelData>(options: {
  data: readonly T[];
  activeIndex: number;
  windowSize: number;
  strategy: PrefetchStrategy;
  direction: ScrollDirection;
  initialQuality?: InitialQuality;
  resolveVideoUri?: (item: T) => string;
}): void {
  const {
    data,
    activeIndex,
    windowSize,
    strategy,
    direction,
    initialQuality = 'auto',
    resolveVideoUri: customResolve,
  } = options;

  const indexes = sortIndexesByPrefetchPriority(
    getPrefetchIndexes(
      activeIndex,
      data.length,
      windowSize,
      strategy,
      direction
    ),
    data
  );

  const posters: string[] = [];
  const videos: string[] = [];

  for (const index of indexes) {
    const item = data[index];
    if (!item) {
      continue;
    }
    if (item.posterUri) {
      posters.push(item.posterUri);
    }
    videos.push(resolveVideoUri(item, initialQuality, customResolve));
  }

  prefetchPosters(posters);
  prefetchVideoHints(videos);
}
