import type { ReactElement, ReactNode, Ref } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** Progressive MP4 (or similar) ladder rung when not using HLS/DASH ABR. */
export interface ReelQuality {
  uri: string;
  /** Approximate bitrate in bits per second — used for low/high/auto picks. */
  bandwidth?: number;
  width?: number;
  height?: number;
  label?: string;
}

export type PrefetchStrategy = 'symmetric' | 'directional';

export type InitialQuality = 'auto' | 'low' | 'high';

export interface ReelData {
  id: string;
  videoUri: string;
  posterUri?: string;
  /**
   * Clip length in **seconds**. Strongly recommended when using
   * `showProgressBar` — without it the bar waits for native metadata and can
   * stay at 0 for several seconds on large / slow-to-probe remote files.
   */
  duration?: number;
  /**
   * Optional progressive quality ladder. Ignored when `resolveVideoUri` is set.
   * Prefer a single HLS/DASH `videoUri` for true adaptive bitrate.
   */
  qualities?: ReelQuality[];
  /**
   * Higher values are warmed earlier when `prefetchEnabled` is on.
   * Use with a ranked feed from your backend.
   */
  prefetchPriority?: number;
}

export interface OverlayMeta {
  index: number;
  isActive: boolean;
}

export interface VideoMeta {
  isActive: boolean;
  muted: boolean;
}

export interface VideoBufferConfig {
  /** Minimum buffer before playback starts, in milliseconds. */
  minBufferMs?: number;
  /** Maximum buffer to keep ahead, in milliseconds. */
  maxBufferMs?: number;
  /** Buffer to keep after playback position, in milliseconds. */
  bufferForPlaybackAfterRebufferMs?: number;
  /**
   * Android disk cache size in MB (react-native-video SimpleCache).
   * `0` disables. When set, the first value wins for the app process.
   * iOS also needs `$RNVideoUseVideoCaching=true` in the app Podfile.
   */
  cacheSizeMB?: number;
  /**
   * iOS / HLS hint — preferred peak bitrate in bits per second.
   * Passed through to react-native-video when supported.
   */
  preferredPeakBitRate?: number;
  /**
   * iOS / HLS hint — preferred maximum resolution.
   * Passed through to react-native-video when supported.
   */
  preferredMaximumResolution?: { width: number; height: number };
}

/** Default Android disk cache size when `videoCacheEnabled` is true. */
export const DEFAULT_VIDEO_CACHE_SIZE_MB = 100;

export interface FlashReelsProps<T extends ReelData = ReelData> {
  data: T[];

  /** Controlled mute state. Prefer this when the parent owns mute UI. */
  muted?: boolean;
  /** Uncontrolled default mute. Ignored when `muted` is provided. */
  defaultMuted?: boolean;
  onMuteChange?: (muted: boolean) => void;
  /** Loop the active video. Defaults to true. */
  loop?: boolean;

  onLike?: (item: T, index: number) => void;
  onDoubleTap?: (item: T, index: number) => void;
  onIndexChange?: (index: number) => void;

  /**
   * Absolutely-positioned overlay over each reel.
   * Library ships no default overlay — consumers own layout.
   */
  renderOverlay?: (item: T, meta: OverlayMeta) => ReactNode;
  /**
   * Swap the video engine. When omitted, the built-in react-native-video
   * player is used.
   */
  renderVideo?: (item: T, meta: VideoMeta) => ReactNode;
  /** Custom heart for the double-tap animation. */
  likeIcon?: ReactNode;

  /**
   * How many items ahead/behind the active index keep a real video source.
   * Caps concurrent decoders — especially important on Android. Default 1.
   */
  preloadWindowSize?: number;

  /**
   * Warm posters and a tiny HTTP Range of upcoming video URIs without mounting
   * extra decoders. Independent of `preloadWindowSize`. Defaults to false.
   */
  prefetchEnabled?: boolean;
  /**
   * How many items to warm beyond the active index when prefetch is on.
   * Defaults to 2.
   */
  prefetchWindowSize?: number;
  /**
   * Prefetch index layout. `directional` biases ahead of scroll; `symmetric`
   * mirrors `±window`. Defaults to `directional`.
   */
  prefetchStrategy?: PrefetchStrategy;

  /**
   * Keep a poster (optionally blurred) under the built-in player until the
   * first frame. Ignored when `renderVideo` is provided. Defaults to false.
   */
  showPosterUntilReady?: boolean;
  /**
   * Blur radius for the poster while waiting / outside the decoder window.
   * Defaults to 0.
   */
  posterBlurRadius?: number;

  /**
   * When `qualities` is set, which rung to play first. `auto` prefers the
   * lowest rung for a fast start. Defaults to `auto`.
   */
  initialQuality?: InitialQuality;
  /**
   * Override video URI selection (qualities / videoUri). Useful for network
   * or experiment-driven source choice in the app.
   */
  resolveVideoUri?: (item: T) => string;

  /**
   * Enable react-native-video disk caching for the built-in player.
   * When true and `bufferConfig.cacheSizeMB` is unset, uses 100 MB.
   * Explicit `bufferConfig.cacheSizeMB` (including `0`) always wins.
   * Ignored when `renderVideo` is provided. Defaults to false.
   */
  videoCacheEnabled?: boolean;

  /**
   * Buffer configuration for the built-in react-native-video player.
   * Ignored when `renderVideo` is provided.
   */
  bufferConfig?: VideoBufferConfig;

  /**
   * Show an Instagram-style progress bar along the bottom of each reel.
   * Only works with the built-in player (`renderVideo` ignores this).
   * Defaults to false.
   *
   * Pass `duration` (seconds) on each `ReelData` item so the bar can track
   * immediately. Without it, progress waits for player metadata (`onLoad`)
   * which can lag on large remote MP4s — see docs.
   */
  showProgressBar?: boolean;
  /** Style for the progress bar track (absolute bottom of the reel). */
  progressBarStyle?: StyleProp<ViewStyle>;

  /**
   * Fired when the feed scrolls near the end. Parent owns appending pages.
   */
  onEndReached?: () => void;
  /**
   * How close to the end (as a fraction of visible length) before
   * `onEndReached` fires. Defaults to 0.5.
   */
  onEndReachedThreshold?: number;
  /** Optional footer (e.g. load-more spinner). Passed through to FlashList. */
  ListFooterComponent?: ReactElement | null;

  /**
   * Controlled pull-to-refresh spinner. Only used when `onRefresh` is set.
   * Defaults to false.
   */
  refreshing?: boolean;
  /**
   * Enables pull-to-refresh. When omitted, overscroll stays disabled so
   * snap paging feels locked.
   */
  onRefresh?: () => void;

  /**
   * Show the built-in centered spinner while the active reel is buffering.
   * Only works with the built-in player (`renderVideo` ignores this).
   * Defaults to false.
   */
  showBufferingLoader?: boolean;
  /**
   * Custom buffering UI. When provided, replaces the default spinner.
   * Enabling this alone is enough — `showBufferingLoader` is not required.
   * Ignored when `renderVideo` is provided.
   */
  renderBufferingLoader?: () => ReactNode;

  containerStyle?: StyleProp<ViewStyle>;
  videoStyle?: StyleProp<ViewStyle>;
}

export interface FlashReelsRef {
  scrollToIndex: (index: number) => void;
  play: () => void;
  pause: () => void;
}

export type FlashReelsComponent = <T extends ReelData = ReelData>(
  props: FlashReelsProps<T> & { ref?: Ref<FlashReelsRef> }
) => ReactNode;
