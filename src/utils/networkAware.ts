import type { InitialQuality } from '../types';

export type NetworkKind = 'wifi' | 'cellular' | 'offline' | 'unknown';

export interface NetworkAwareState {
  /** Coarse link type derived from NetInfo (or tests). */
  kind: NetworkKind;
  isConnected: boolean;
}

export interface NetworkAwareDefaults {
  /** Effective start quality for progressive ladders. */
  initialQuality: InitialQuality;
  /** Whether HTTP/poster prefetch should run. */
  prefetchEnabled: boolean;
  /** Capped prefetch window (may shrink on cellular). */
  prefetchWindowSize: number;
  /** Capped concurrent video Range warm-ups. */
  prefetchMaxConcurrent: number;
  /** Optional HLS peak bitrate hint when unset by the consumer. */
  preferredPeakBitRate?: number;
}

export interface NetworkAwareInput {
  state: NetworkAwareState;
  initialQuality: InitialQuality;
  prefetchWindowSize: number;
  prefetchMaxConcurrent: number;
  /** Consumer already set an explicit peak bitrate. */
  hasPreferredPeakBitRate: boolean;
}

/** Conservative cellular HLS hint (~1.5 Mbps). */
export const CELLULAR_PREFERRED_PEAK_BITRATE = 1_500_000;

/**
 * Map coarse network state into start-quality / prefetch budget defaults.
 * Custom `resolveVideoUri` in the app still wins over `initialQuality`.
 */
export function getNetworkAwareDefaults(
  input: NetworkAwareInput
): NetworkAwareDefaults {
  const {
    state,
    initialQuality,
    prefetchWindowSize,
    prefetchMaxConcurrent,
    hasPreferredPeakBitRate,
  } = input;

  if (!state.isConnected || state.kind === 'offline') {
    return {
      initialQuality,
      prefetchEnabled: false,
      prefetchWindowSize: 0,
      prefetchMaxConcurrent: 0,
    };
  }

  if (state.kind === 'cellular') {
    const quality: InitialQuality =
      initialQuality === 'auto' ? 'low' : initialQuality;
    return {
      initialQuality: quality,
      prefetchEnabled: true,
      prefetchWindowSize: Math.min(prefetchWindowSize, 1),
      prefetchMaxConcurrent: Math.min(prefetchMaxConcurrent, 1),
      preferredPeakBitRate: hasPreferredPeakBitRate
        ? undefined
        : CELLULAR_PREFERRED_PEAK_BITRATE,
    };
  }

  // wifi / ethernet / unknown — keep consumer knobs
  return {
    initialQuality,
    prefetchEnabled: true,
    prefetchWindowSize,
    prefetchMaxConcurrent,
  };
}

/** Normalize NetInfo-like type strings into our coarse kind. */
export function networkKindFromNetInfoType(
  type: string | null | undefined,
  isConnected: boolean | null | undefined
): NetworkAwareState {
  const t = (type ?? 'unknown').toLowerCase();

  if (isConnected === false || t === 'none') {
    return { kind: 'offline', isConnected: false };
  }

  if (t === 'wifi' || t === 'ethernet' || t === 'wimax') {
    return { kind: 'wifi', isConnected: true };
  }

  if (
    t === 'cellular' ||
    t === '2g' ||
    t === '3g' ||
    t === '4g' ||
    t === '5g'
  ) {
    return { kind: 'cellular', isConnected: true };
  }

  return {
    kind: 'unknown',
    isConnected: isConnected === true || isConnected == null,
  };
}
