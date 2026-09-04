import type { ReactElement, ReactNode, Ref } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

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
}

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
