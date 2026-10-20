import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import Video, {
  ViewType,
  type OnLoadData,
  type OnProgressData,
  type ReactVideoProps,
  type VideoRef,
} from 'react-native-video';
import { useDoubleTap } from '../hooks/useDoubleTap';
import type {
  InitialQuality,
  OverlayMeta,
  ReelData,
  VideoBufferConfig,
  VideoMeta,
} from '../types';
import { resolveVideoUri as resolveItemVideoUri } from '../utils/resolveVideoUri';
import { BufferingLoader } from './BufferingLoader';
import { LikeHeart } from './LikeHeart';
import { PauseIndicator } from './PauseIndicator';
import { ProgressBar } from './ProgressBar';

/** How often we sample the playhead while a reel is active. */
const PROGRESS_POLL_MS = 100;

/**
 * Accept seconds, or milliseconds when a value looks like ms for short-form
 * video (react-native-video is seconds; some Android paths emit ms).
 */
function normalizeDurationSeconds(duration: number | undefined): number {
  if (duration == null || !(duration > 0) || !Number.isFinite(duration)) {
    return 0;
  }
  return duration >= 1000 ? duration / 1000 : duration;
}

export interface ReelItemProps<T extends ReelData = ReelData> {
  item: T;
  index: number;
  height: number;
  loop: boolean;
  preloadWindowSize: number;
  /** Passed from parent so ReelItem doesn't subscribe to context. */
  isActive: boolean;
  /** Whether this item is within the preload window and should mount a video. */
  shouldLoad: boolean;
  isMuted: boolean;
  isPausedGlobally: boolean;
  likeIcon?: ReactNode;
  bufferConfig?: VideoBufferConfig;
  showProgressBar?: boolean;
  progressBarStyle?: StyleProp<ViewStyle>;
  showBufferingLoader?: boolean;
  renderBufferingLoader?: () => ReactNode;
  showPosterUntilReady?: boolean;
  posterBlurRadius?: number;
  initialQuality?: InitialQuality;
  resolveVideoUri?: (item: T) => string;
  videoStyle?: StyleProp<ViewStyle>;
  renderOverlay?: (item: T, meta: OverlayMeta) => ReactNode;
  renderVideo?: (item: T, meta: VideoMeta) => ReactNode;
  onLike?: (item: T, index: number) => void;
  onDoubleTap?: (item: T, index: number) => void;
}

interface HeartBurst {
  id: number;
  x: number;
  y: number;
}

function ReelItemInner<T extends ReelData>({
  item,
  index,
  height,
  loop,
  preloadWindowSize: _preloadWindowSize,
  isActive,
  shouldLoad,
  isMuted,
  isPausedGlobally,
  likeIcon,
  bufferConfig,
  showProgressBar = false,
  progressBarStyle,
  showBufferingLoader = false,
  renderBufferingLoader,
  showPosterUntilReady = true,
  posterBlurRadius = 0,
  initialQuality = 'auto',
  resolveVideoUri: customResolveVideoUri,
  videoStyle,
  renderOverlay,
  renderVideo,
  onLike,
  onDoubleTap,
}: ReelItemProps<T>) {
  // Local pause override for single-tap; cleared when active state flips so
  // scrolling to a reel always starts playback fresh.
  const [pausedOverride, setPausedOverride] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hearts, setHearts] = useState<HeartBurst[]>([]);
  const progress = useSharedValue(0);
  const durationRef = useRef(0);
  const isActiveRef = useRef(isActive);
  const videoRef = useRef<VideoRef>(null);
  const loadReadyFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const bufferingEnabled =
    !renderVideo && (showBufferingLoader || renderBufferingLoader != null);
  /** Blur/cover poster until first frame — default on for Instagram-like swipe-in. */
  const posterUntilReady = !renderVideo && showPosterUntilReady;

  isActiveRef.current = isActive;

  const playbackUri = useMemo(
    () => resolveItemVideoUri(item, initialQuality, customResolveVideoUri),
    [item, initialQuality, customResolveVideoUri]
  );

  const clearLoadReadyFallback = useCallback(() => {
    if (loadReadyFallbackRef.current != null) {
      clearTimeout(loadReadyFallbackRef.current);
      loadReadyFallbackRef.current = null;
    }
  }, []);

  const markVideoReady = useCallback(() => {
    clearLoadReadyFallback();
    setIsVideoReady((prev) => (prev ? prev : true));
  }, [clearLoadReadyFallback]);

  // Seed from ReelData.duration when present so the bar can move before native
  // metadata arrives. Player onLoad may refine the value later.
  useEffect(() => {
    progress.value = 0;
    const fromData = normalizeDurationSeconds(item.duration);
    durationRef.current = fromData;
  }, [item.id, item.duration, progress]);

  // Reset pause when active state flips, but skip the setState when already false
  // to avoid a pointless re-render during fast paging.
  useEffect(() => {
    setPausedOverride((prev) => (prev ? false : prev));
  }, [isActive]);

  // Clear stale buffering / ready flags when the item leaves the load window
  // or the source changes.
  useEffect(() => {
    if (!shouldLoad) {
      clearLoadReadyFallback();
      setIsBuffering((prev) => (prev ? false : prev));
      setIsVideoReady((prev) => (prev ? false : prev));
    }
  }, [shouldLoad, clearLoadReadyFallback]);

  useEffect(() => {
    clearLoadReadyFallback();
    setIsVideoReady(false);
  }, [playbackUri, item.id, clearLoadReadyFallback]);

  useEffect(() => {
    if (!isActive || !shouldLoad) {
      setIsBuffering((prev) => (prev ? false : prev));
    }
  }, [isActive, shouldLoad]);

  useEffect(() => {
    return () => {
      clearLoadReadyFallback();
    };
  }, [clearLoadReadyFallback]);

  const setProgressRatio = useCallback(
    (currentTime: number, duration: number) => {
      // Ignore ticks for inactive neighbors so a late event can't desync the bar.
      if (!isActiveRef.current) {
        return;
      }
      if (duration <= 0 || !Number.isFinite(duration)) {
        return;
      }
      if (!Number.isFinite(currentTime) || currentTime < 0) {
        return;
      }
      progress.value = Math.min(1, Math.max(0, currentTime / duration));
    },
    [progress]
  );

  const rememberDuration = useCallback(
    (duration: number, source: 'load' | 'progress') => {
      const next = normalizeDurationSeconds(duration);
      if (next <= 0) {
        return;
      }
      // Data duration seeds early; onLoad may refine. Progress events only fill
      // when nothing is known yet.
      if (source === 'progress' && durationRef.current > 0) {
        return;
      }
      durationRef.current = next;
    },
    []
  );

  const syncProgressFromPlayer = useCallback(() => {
    const duration = durationRef.current;
    const player = videoRef.current;
    if (!isActiveRef.current || !player || duration <= 0) {
      return;
    }
    player
      .getCurrentPosition()
      .then((currentTime) => {
        setProgressRatio(currentTime, durationRef.current);
      })
      .catch(() => {
        // Native player may not be ready yet — next poll/onProgress will retry.
      });
  }, [setProgressRatio]);

  // Reset the bar when leaving. Do NOT seek(0) on activate — seeking on swipe-in
  // delays/suppresses onProgress on some Android builds, which caused the bar to
  // sit at 0 then jump to ~70% once events resumed.
  useEffect(() => {
    if (!showProgressBar || renderVideo) {
      return;
    }
    if (!isActive) {
      progress.value = 0;
      return;
    }
    progress.value = 0;
    syncProgressFromPlayer();
  }, [
    isActive,
    showProgressBar,
    renderVideo,
    progress,
    syncProgressFromPlayer,
  ]);

  // Poll the real playhead while active. More reliable than onProgress alone after
  // viewability changes / pause↔play transitions.
  useEffect(() => {
    if (!showProgressBar || renderVideo || !isActive || !shouldLoad) {
      return;
    }

    const id = setInterval(() => {
      syncProgressFromPlayer();
    }, PROGRESS_POLL_MS);

    syncProgressFromPlayer();
    return () => clearInterval(id);
  }, [
    isActive,
    shouldLoad,
    showProgressBar,
    renderVideo,
    syncProgressFromPlayer,
  ]);

  const handleLoad = useCallback(
    (data: OnLoadData) => {
      // Always keep duration, even while preloading (inactive).
      rememberDuration(data.duration, 'load');
      setProgressRatio(data.currentTime, durationRef.current);
      syncProgressFromPlayer();
      // Neighbor warmup: onLoad is enough so a prefetched reel can swipe in
      // without a poster flash. Active reel prefers first-frame events below.
      if (!isActiveRef.current) {
        markVideoReady();
        return;
      }
      // Android New Arch often skips onReadyForDisplay when a poster covers the
      // surface. Prefer first-frame events, but fall back shortly after onLoad
      // so the cover cannot stick forever on a healthy stream.
      if (Platform.OS === 'android') {
        clearLoadReadyFallback();
        loadReadyFallbackRef.current = setTimeout(() => {
          loadReadyFallbackRef.current = null;
          if (isActiveRef.current) {
            markVideoReady();
          }
        }, 120);
      }
    },
    [
      rememberDuration,
      setProgressRatio,
      syncProgressFromPlayer,
      clearLoadReadyFallback,
      markVideoReady,
    ]
  );

  const handleProgress = useCallback(
    (data: OnProgressData) => {
      rememberDuration(data.seekableDuration, 'progress');
      setProgressRatio(data.currentTime, durationRef.current);
      // First progress tick ⇒ frames are painting (active or neighbor warmup).
      markVideoReady();
    },
    [rememberDuration, setProgressRatio, markVideoReady]
  );

  const handleBuffer = useCallback((data: { isBuffering: boolean }) => {
    setIsBuffering(data.isBuffering);
  }, []);

  const handleReadyForDisplay = useCallback(() => {
    markVideoReady();
  }, [markVideoReady]);

  const handleVideoError = useCallback(() => {
    setIsBuffering(false);
    // Keep poster visible on error instead of revealing a black surface.
    setIsVideoReady(false);
  }, []);

  const handleSingleTap = useCallback(() => {
    if (!isActive) {
      return;
    }
    setPausedOverride((prev) => !prev);
  }, [isActive]);

  const handleDoubleTap = useCallback(
    (x: number, y: number) => {
      onDoubleTap?.(item, index);
      onLike?.(item, index);
      setHearts((prev) => {
        const next = { id: Date.now() + Math.random(), x, y };
        // Cap concurrent hearts to avoid unbounded render churn on rapid taps.
        const MAX_HEARTS = 5;
        if (prev.length >= MAX_HEARTS) {
          return [...prev.slice(prev.length - MAX_HEARTS + 1), next];
        }
        return [...prev, next];
      });
    },
    [item, index, onDoubleTap, onLike]
  );

  const gesture = useDoubleTap({
    onSingleTap: handleSingleTap,
    onDoubleTap: handleDoubleTap,
  });

  const removeHeart = useCallback((id: number) => {
    setHearts((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const userPaused = pausedOverride || isPausedGlobally;
  // Neighbors play muted until the first frame is decoded, then pause — so a
  // swipe-in can reveal an already-ready surface instead of poster → loader.
  const warmingNeighbor = shouldLoad && !isActive && !isVideoReady;
  const paused = userPaused || !shouldLoad || (!isActive && !warmingNeighbor);
  const showPauseIndicator = isActive && userPaused;
  // Spinner only for mid-playback rebuffers — not during the poster-covered
  // first paint (that was the “loader on every swipe” regression).
  const showBufferingUi =
    bufferingEnabled &&
    isActive &&
    shouldLoad &&
    isVideoReady &&
    isBuffering &&
    !userPaused;

  const effectiveMuted = !isActive || isMuted;

  const videoMeta: VideoMeta = { isActive, muted: effectiveMuted };

  // Explicit pixel height — absoluteFill alone is unreliable for ExoPlayer
  // surfaces inside FlashList absolute cells.
  const mediaStyle = [
    styles.media,
    { width: '100%' as const, height },
    videoStyle,
  ] as StyleProp<ImageStyle>;
  const waitingForFrame = !isVideoReady;
  const blurRadius =
    posterBlurRadius > 0 &&
    (!shouldLoad || (posterUntilReady && waitingForFrame))
      ? posterBlurRadius
      : 0;

  const posterNode = item.posterUri ? (
    <Image
      source={{ uri: item.posterUri }}
      style={mediaStyle}
      resizeMode="cover"
      blurRadius={blurRadius > 0 ? blurRadius : undefined}
    />
  ) : (
    <View
      style={[styles.media, styles.posterFallback, { height }, videoStyle]}
    />
  );

  let videoNode: ReactNode;
  if (!shouldLoad) {
    videoNode = posterNode;
  } else if (renderVideo) {
    videoNode = renderVideo(item, videoMeta);
  } else {
    const source: ReactVideoProps['source'] = { uri: playbackUri };
    const progressProps = {
      onLoad: handleLoad,
      onProgress: handleProgress,
      progressUpdateInterval: PROGRESS_POLL_MS,
    };

    const resolvedBuffer = bufferConfig
      ? {
          minBufferMs: bufferConfig.minBufferMs ?? 1500,
          maxBufferMs: bufferConfig.maxBufferMs ?? 5000,
          bufferForPlaybackMs: bufferConfig.minBufferMs ?? 500,
          bufferForPlaybackAfterRebufferMs:
            bufferConfig.bufferForPlaybackAfterRebufferMs ?? 1500,
          ...(bufferConfig.preferredPeakBitRate != null
            ? { preferredPeakBitRate: bufferConfig.preferredPeakBitRate }
            : undefined),
          ...(bufferConfig.preferredMaximumResolution != null
            ? {
                preferredMaximumResolution:
                  bufferConfig.preferredMaximumResolution,
              }
            : undefined),
          ...(bufferConfig.cacheSizeMB != null
            ? { cacheSizeMB: bufferConfig.cacheSizeMB }
            : undefined),
        }
      : undefined;

    videoNode = (
      <>
        {/* Poster under the player so a late surface paint never flashes black
            when the cover is removed. Overlay cover (below) hides scale-in. */}
        {posterNode}
        <Video
          ref={showProgressBar ? videoRef : undefined}
          source={source}
          style={mediaStyle}
          resizeMode="cover"
          repeat={loop}
          paused={paused}
          muted={effectiveMuted}
          controls={false}
          poster={undefined}
          posterResizeMode="cover"
          playInBackground={false}
          playWhenInactive={false}
          ignoreSilentSwitch="ignore"
          hideShutterView
          shutterColor="transparent"
          // TextureView participates in the normal view stack so a poster
          // cover does not suppress ready/progress the way SurfaceView can
          // under the New Architecture — and keeps neighbor warmup viable.
          {...(Platform.OS === 'android'
            ? { viewType: ViewType.TEXTURE }
            : undefined)}
          onReadyForDisplay={handleReadyForDisplay}
          onError={handleVideoError}
          {...progressProps}
          {...(bufferingEnabled ? { onBuffer: handleBuffer } : undefined)}
          {...(resolvedBuffer ? { bufferConfig: resolvedBuffer } : undefined)}
        />
        {waitingForFrame && posterUntilReady ? (
          <View pointerEvents="none" style={styles.posterOverlay}>
            {posterNode}
          </View>
        ) : null}
      </>
    );
  }

  // Keep the bar mounted for preloaded items; only the active reel shows it.
  const mountBar = showProgressBar && shouldLoad && !renderVideo;

  let bufferingNode: ReactNode = null;
  if (showBufferingUi) {
    bufferingNode = renderBufferingLoader ? (
      <View pointerEvents="none" style={styles.bufferingSlot}>
        {renderBufferingLoader()}
      </View>
    ) : showBufferingLoader ? (
      <BufferingLoader visible />
    ) : null;
  }

  return (
    <View style={[styles.container, { height }]}>
      {/* Keep Video outside GestureDetector — wrapping the surface in RNGH
          commonly yields a permanent black frame on Android. */}
      <View style={styles.media} pointerEvents="none">
        {videoNode}
      </View>

      <GestureDetector gesture={gesture}>
        <View style={styles.gestureLayer} />
      </GestureDetector>

      {bufferingNode}

      <PauseIndicator visible={showPauseIndicator} />

      {renderOverlay ? (
        <View style={styles.overlay} pointerEvents="box-none">
          {renderOverlay(item, { index, isActive })}
        </View>
      ) : null}

      {mountBar ? (
        <ProgressBar
          progress={progress}
          style={progressBarStyle}
          visible={isActive}
        />
      ) : null}

      {hearts.map((heart) => (
        <LikeHeart
          key={heart.id}
          x={heart.x}
          y={heart.y}
          icon={likeIcon}
          onFinished={() => removeHeart(heart.id)}
        />
      ))}
    </View>
  );
}

export const ReelItem = memo(ReelItemInner) as typeof ReelItemInner;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  media: {
    ...StyleSheet.absoluteFill,
  },
  gestureLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
  },
  posterOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  bufferingSlot: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
  posterFallback: {
    backgroundColor: '#111',
  },
});
