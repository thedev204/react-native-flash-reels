import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import Video, {
  type OnLoadData,
  type OnProgressData,
  type ReactVideoProps,
  type VideoRef,
} from 'react-native-video';
import { useDoubleTap } from '../hooks/useDoubleTap';
import type {
  OverlayMeta,
  ReelData,
  VideoBufferConfig,
  VideoMeta,
} from '../types';
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
  const [hearts, setHearts] = useState<HeartBurst[]>([]);
  const progress = useSharedValue(0);
  const durationRef = useRef(0);
  const isActiveRef = useRef(isActive);
  const videoRef = useRef<VideoRef>(null);

  const bufferingEnabled =
    !renderVideo && (showBufferingLoader || renderBufferingLoader != null);

  isActiveRef.current = isActive;

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

  // Clear stale buffering flags when the item leaves the active/load window.
  useEffect(() => {
    if (!isActive || !shouldLoad) {
      setIsBuffering((prev) => (prev ? false : prev));
    }
  }, [isActive, shouldLoad]);

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
    },
    [rememberDuration, setProgressRatio, syncProgressFromPlayer]
  );

  const handleProgress = useCallback(
    (data: OnProgressData) => {
      rememberDuration(data.seekableDuration, 'progress');
      setProgressRatio(data.currentTime, durationRef.current);
    },
    [rememberDuration, setProgressRatio]
  );

  const handleBuffer = useCallback((data: { isBuffering: boolean }) => {
    setIsBuffering(data.isBuffering);
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
  const paused = !isActive || userPaused || !shouldLoad;
  const showPauseIndicator = isActive && userPaused;
  const showBufferingUi =
    bufferingEnabled && isActive && shouldLoad && isBuffering && !userPaused;

  // Inside the window but not active: keep buffering muted so the next scroll
  // starts without a cold decoder open. Active item respects global mute.
  const effectiveMuted = !isActive || isMuted;

  const videoMeta: VideoMeta = { isActive, muted: effectiveMuted };

  const mediaStyle = [styles.media, videoStyle] as StyleProp<ImageStyle>;

  let videoNode: ReactNode;
  if (!shouldLoad) {
    videoNode = item.posterUri ? (
      <Image
        source={{ uri: item.posterUri }}
        style={mediaStyle}
        resizeMode="cover"
      />
    ) : (
      <View style={[styles.media, styles.posterFallback, videoStyle]} />
    );
  } else if (renderVideo) {
    videoNode = renderVideo(item, videoMeta);
  } else {
    const source: ReactVideoProps['source'] = { uri: item.videoUri };
    // Keep onLoad/onProgress attached while preloading so duration is known
    // before the reel becomes active — avoids a blank bar on first swipe-in.
    const progressProps = showProgressBar
      ? {
          onLoad: handleLoad,
          onProgress: handleProgress,
          progressUpdateInterval: PROGRESS_POLL_MS,
        }
      : undefined;
    videoNode = (
      <Video
        ref={showProgressBar ? videoRef : undefined}
        source={source}
        style={mediaStyle}
        resizeMode="cover"
        repeat={loop}
        paused={paused}
        muted={effectiveMuted}
        // Explicit — some platforms flash native chrome on cold mount if omitted.
        controls={false}
        poster={item.posterUri}
        posterResizeMode="cover"
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        {...progressProps}
        {...(bufferingEnabled ? { onBuffer: handleBuffer } : undefined)}
        {...(bufferConfig
          ? {
              bufferConfig: {
                minBufferMs: bufferConfig.minBufferMs ?? 2500,
                maxBufferMs: bufferConfig.maxBufferMs ?? 5000,
                bufferForPlaybackMs: bufferConfig.minBufferMs ?? 2500,
                bufferForPlaybackAfterRebufferMs:
                  bufferConfig.bufferForPlaybackAfterRebufferMs ?? 5000,
              },
            }
          : undefined)}
      />
    );
  }

  // Keep the bar mounted for preloaded items so track width is measured before
  // activation; only the active reel shows it.
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
      <GestureDetector gesture={gesture}>
        <View style={styles.media}>{videoNode}</View>
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
