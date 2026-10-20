import { Image } from 'react-native';
import type {
  InitialQuality,
  PrefetchStrategy,
  ReelData,
  ScrollDirection,
} from '../types';
import { resolveVideoUri } from './resolveVideoUri';

export type { ScrollDirection };

/** Bytes requested to warm CDN / OS HTTP cache without a full download. */
const VIDEO_HINT_RANGE_END = 65_535;

/** Default concurrent video Range warm-ups when prefetch is on. */
export const DEFAULT_PREFETCH_MAX_CONCURRENT = 2;

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

/** Active video warm AbortControllers keyed by URI. */
const videoAbortControllers = new Map<string, AbortController>();

interface QueuedVideoWarm {
  uri: string;
  controller: AbortController;
}

let videoWarmQueue: QueuedVideoWarm[] = [];
let activeVideoWarms = 0;
let maxConcurrentVideoWarms = DEFAULT_PREFETCH_MAX_CONCURRENT;

/** Test helper — clears module-level dedupe sets and aborts in-flight warms. */
export function resetPrefetchState(): void {
  warmedPosters.clear();
  inFlightPosters.clear();
  warmedVideos.clear();
  inFlightVideos.clear();
  for (const controller of videoAbortControllers.values()) {
    controller.abort();
  }
  videoAbortControllers.clear();
  videoWarmQueue = [];
  activeVideoWarms = 0;
  maxConcurrentVideoWarms = DEFAULT_PREFETCH_MAX_CONCURRENT;
}

export function setPrefetchMaxConcurrent(max: number): void {
  maxConcurrentVideoWarms = Math.max(0, Math.floor(max));
  pumpVideoWarmQueue();
}

/** Whether a video URI has completed an HTTP Range warm-up this session. */
export function isVideoWarmed(uri: string): boolean {
  return Boolean(uri) && warmedVideos.has(uri);
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

async function warmVideoUri(uri: string, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return;
  }
  try {
    const response = await fetch(uri, {
      method: 'GET',
      headers: {
        Range: `bytes=0-${VIDEO_HINT_RANGE_END}`,
      },
      signal,
    });
    if (signal.aborted) {
      return;
    }
    // Drain a little so some runtimes actually complete the Range request.
    await response.arrayBuffer();
  } catch (error) {
    if (signal.aborted) {
      return;
    }
    const name =
      error && typeof error === 'object' && 'name' in error
        ? String((error as { name?: string }).name)
        : '';
    if (name === 'AbortError') {
      return;
    }
    try {
      await fetch(uri, { method: 'HEAD', signal });
    } catch {
      // Soft-fail — decoder preload / playback still work.
    }
  }
}

function pumpVideoWarmQueue(): void {
  while (
    activeVideoWarms < maxConcurrentVideoWarms &&
    videoWarmQueue.length > 0
  ) {
    const next = videoWarmQueue.shift();
    if (!next) {
      break;
    }
    const { uri, controller } = next;
    if (controller.signal.aborted) {
      inFlightVideos.delete(uri);
      videoAbortControllers.delete(uri);
      continue;
    }
    activeVideoWarms += 1;
    warmVideoUri(uri, controller.signal)
      .then(() => {
        if (!controller.signal.aborted) {
          warmedVideos.add(uri);
        }
      })
      .finally(() => {
        activeVideoWarms = Math.max(0, activeVideoWarms - 1);
        inFlightVideos.delete(uri);
        videoAbortControllers.delete(uri);
        pumpVideoWarmQueue();
      });
  }
}

function enqueueVideoWarm(uri: string): void {
  if (
    !uri ||
    warmedVideos.has(uri) ||
    inFlightVideos.has(uri) ||
    maxConcurrentVideoWarms <= 0
  ) {
    return;
  }
  const controller = new AbortController();
  inFlightVideos.add(uri);
  videoAbortControllers.set(uri, controller);
  videoWarmQueue.push({ uri, controller });
  pumpVideoWarmQueue();
}

/**
 * Abort video warms whose URIs are no longer in the desired set.
 * Posters are left alone (cheap + useful on reverse scroll).
 */
export function abortVideoWarmsOutside(keepUris: ReadonlySet<string>): void {
  for (const [uri, controller] of [...videoAbortControllers.entries()]) {
    if (keepUris.has(uri)) {
      continue;
    }
    controller.abort();
    videoAbortControllers.delete(uri);
    inFlightVideos.delete(uri);
  }
  videoWarmQueue = videoWarmQueue.filter((item) => {
    if (keepUris.has(item.uri)) {
      return true;
    }
    item.controller.abort();
    inFlightVideos.delete(item.uri);
    return false;
  });
}

export function prefetchVideoHints(uris: readonly string[]): void {
  const keep = new Set(uris.filter(Boolean));
  abortVideoWarmsOutside(keep);
  for (const uri of uris) {
    enqueueVideoWarm(uri);
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
  maxConcurrent?: number;
}): void {
  const {
    data,
    activeIndex,
    windowSize,
    strategy,
    direction,
    initialQuality = 'auto',
    resolveVideoUri: customResolve,
    maxConcurrent = DEFAULT_PREFETCH_MAX_CONCURRENT,
  } = options;

  if (windowSize <= 0 || maxConcurrent <= 0) {
    abortVideoWarmsOutside(new Set());
    return;
  }

  setPrefetchMaxConcurrent(maxConcurrent);

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

  // Posters first (cheap first-frame), then video Range hints.
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
