import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react';
import {
  Platform,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';

interface ViewableItem {
  index: number | null;
}

interface ViewableItemsChangedInfo {
  viewableItems: ReadonlyArray<ViewableItem>;
}

import {
  FlashReelsContext,
  type FlashReelsContextValue,
} from '../context/FlashReelsContext';
import type {
  FlashReelsProps,
  FlashReelsRef,
  ReelData,
  ScrollDirection,
} from '../types';
import {
  getNetworkAwareDefaults,
  type NetworkAwareState,
} from '../utils/networkAware';
import {
  subscribeNetworkAware,
  warnMissingNetInfoOnce,
} from '../utils/netInfoBridge';
import {
  DEFAULT_PREFETCH_MAX_CONCURRENT,
  runFeedPrefetch,
} from '../utils/prefetch';
import { shouldLoadReelAround } from '../utils/preloadWindow';
import { resolveBufferConfig } from '../utils/resolveBufferConfig';
import { predictScrollTarget } from '../utils/scrollPrediction';
import { ReelItem } from './ReelItem';

const VIEWABILITY_CONFIG = {
  // Slightly lower than 60 so a light page flick still settles the active index.
  itemVisiblePercentThreshold: 50,
  waitForInteraction: false,
};

/** Snap correction threshold — ignore sub-pixel / rubber-band noise. */
const SNAP_EPSILON_PX = 2;
/** Treat |velocityY| below this as a settled drag (no fling). */
const SETTLE_VELOCITY_EPSILON = 0.05;

const DEFAULT_NETWORK_STATE: NetworkAwareState = {
  kind: 'unknown',
  isConnected: true,
};

function FlashReelsInner<T extends ReelData>(
  props: FlashReelsProps<T>,
  ref: Ref<FlashReelsRef>
) {
  const {
    data,
    muted: mutedProp,
    defaultMuted = true,
    onMuteChange,
    loop = true,
    onLike,
    onDoubleTap,
    onIndexChange,
    renderOverlay,
    renderVideo,
    likeIcon,
    preloadWindowSize = 1,
    preloadStrategy = 'symmetric',
    drawDistancePages: drawDistancePagesProp,
    prefetchEnabled = false,
    prefetchWindowSize = 2,
    prefetchStrategy = 'directional',
    prefetchMaxConcurrent = DEFAULT_PREFETCH_MAX_CONCURRENT,
    networkAware = false,
    showPosterUntilReady = true,
    posterBlurRadius = 0,
    initialQuality = 'auto',
    resolveVideoUri,
    videoCacheEnabled = false,
    bufferConfig,
    showProgressBar = false,
    progressBarStyle,
    onEndReached,
    onEndReachedThreshold = 0.5,
    ListFooterComponent,
    refreshing = false,
    onRefresh,
    showBufferingLoader = false,
    renderBufferingLoader,
    containerStyle,
    videoStyle,
  } = props;

  const { height: windowHeight } = useWindowDimensions();
  // Prefer measured list height over window height — status/nav chrome makes
  // window-sized items taller than the viewport and paging feels "stuck".
  const [listHeight, setListHeight] = useState(windowHeight);
  const listRef = useRef<FlashListRef<T>>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [predictedIndex, setPredictedIndex] = useState(0);
  const [uncontrolledMuted, setUncontrolledMuted] = useState(defaultMuted);
  const [isPausedGlobally, setIsPausedGlobally] = useState(false);
  const [networkState, setNetworkState] = useState<NetworkAwareState>(
    DEFAULT_NETWORK_STATE
  );
  const scrollDirectionRef = useRef<ScrollDirection>(1);
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(1);
  const isScrollingRef = useRef(false);
  const activeIndexRef = useRef(0);

  const isControlled = mutedProp !== undefined;
  const isMuted = isControlled ? mutedProp : uncontrolledMuted;
  const refreshEnabled = onRefresh != null;

  const drawDistancePages = drawDistancePagesProp ?? preloadWindowSize + 1;

  const networkDefaults = useMemo(() => {
    if (!networkAware) {
      return null;
    }
    return getNetworkAwareDefaults({
      state: networkState,
      initialQuality,
      prefetchWindowSize,
      prefetchMaxConcurrent,
      hasPreferredPeakBitRate: bufferConfig?.preferredPeakBitRate != null,
    });
  }, [
    networkAware,
    networkState,
    initialQuality,
    prefetchWindowSize,
    prefetchMaxConcurrent,
    bufferConfig?.preferredPeakBitRate,
  ]);

  const effectiveInitialQuality =
    networkDefaults?.initialQuality ?? initialQuality;
  const effectivePrefetchEnabled =
    prefetchEnabled && (networkDefaults?.prefetchEnabled ?? true);
  const effectivePrefetchWindowSize =
    networkDefaults?.prefetchWindowSize ?? prefetchWindowSize;
  const effectivePrefetchMaxConcurrent =
    networkDefaults?.prefetchMaxConcurrent ?? prefetchMaxConcurrent;

  const effectiveBufferConfig = useMemo(() => {
    const resolved = resolveBufferConfig(bufferConfig, videoCacheEnabled);
    if (networkDefaults?.preferredPeakBitRate == null) {
      return resolved;
    }
    if (resolved?.preferredPeakBitRate != null) {
      return resolved;
    }
    return {
      ...resolved,
      preferredPeakBitRate: networkDefaults.preferredPeakBitRate,
    };
  }, [bufferConfig, videoCacheEnabled, networkDefaults?.preferredPeakBitRate]);

  useEffect(() => {
    if (!networkAware) {
      return;
    }
    const unsubscribe = subscribeNetworkAware(setNetworkState);
    if (unsubscribe == null) {
      warnMissingNetInfoOnce();
      return;
    }
    return unsubscribe;
  }, [networkAware]);

  const setMuted = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledMuted(next);
      }
      onMuteChange?.(next);
    },
    [isControlled, onMuteChange]
  );

  const toggleMute = useCallback(() => {
    setMuted(!isMuted);
  }, [isMuted, setMuted]);

  const onContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.height);
    if (next > 0) {
      setListHeight((prev) => (prev === next ? prev : next));
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index: number) => {
        listRef.current?.scrollToIndex({ index, animated: true });
      },
      play: () => setIsPausedGlobally(false),
      pause: () => setIsPausedGlobally(true),
    }),
    []
  );

  const applyDirection = useCallback((next: ScrollDirection) => {
    if (next === 0) {
      return;
    }
    if (scrollDirectionRef.current !== next) {
      scrollDirectionRef.current = next;
      setScrollDirection(next);
    }
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: ViewableItemsChangedInfo) => {
      const first = viewableItems[0];
      if (first?.index == null) {
        return;
      }
      const nextIndex = first.index;
      setActiveIndex((prev) => {
        if (prev === nextIndex) {
          return prev;
        }
        if (nextIndex > prev) {
          applyDirection(1);
        } else if (nextIndex < prev) {
          applyDirection(-1);
        }
        onIndexChange?.(nextIndex);
        activeIndexRef.current = nextIndex;
        return nextIndex;
      });
      if (!isScrollingRef.current) {
        setPredictedIndex(nextIndex);
      }
    },
    [onIndexChange, applyDirection]
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrollingRef.current = true;
      const { contentOffset, velocity } = event.nativeEvent;
      const prediction = predictScrollTarget({
        offsetY: contentOffset.y,
        listHeight,
        dataLength: data.length,
        velocityY: velocity?.y,
      });
      applyDirection(prediction.direction);
      setPredictedIndex((prev) =>
        prev === prediction.predictedIndex ? prev : prediction.predictedIndex
      );
    },
    [listHeight, data.length, applyDirection]
  );

  const settleToNearestPage = useCallback(
    (offsetY: number) => {
      if (listHeight <= 0 || data.length === 0) {
        return;
      }
      const maxIndex = data.length - 1;
      const nearest = Math.max(
        0,
        Math.min(maxIndex, Math.round(offsetY / listHeight))
      );
      const target = nearest * listHeight;
      if (Math.abs(offsetY - target) > SNAP_EPSILON_PX) {
        listRef.current?.scrollToOffset({ offset: target, animated: true });
      }
    },
    [listHeight, data.length]
  );

  // Finger-up only: never cancel an in-flight fling. Settling here made
  // paging feel stuck and required a full-page drag with no momentum.
  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const velocityY = event.nativeEvent.velocity?.y ?? 0;
      if (Math.abs(velocityY) > SETTLE_VELOCITY_EPSILON) {
        // Momentum will follow — wait for onMomentumScrollEnd.
        return;
      }
      isScrollingRef.current = false;
      settleToNearestPage(event.nativeEvent.contentOffset.y);
      setPredictedIndex(activeIndexRef.current);
    },
    [settleToNearestPage]
  );

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrollingRef.current = false;
      settleToNearestPage(event.nativeEvent.contentOffset.y);
      setPredictedIndex(activeIndexRef.current);
    },
    [settleToNearestPage]
  );

  // Prefer predicted index while scrolling for HTTP prefetch and decoder mounts.
  // Playback ownership stays on settled activeIndex; neighbors only warm muted.
  const prefetchIndex =
    predictedIndex !== activeIndex ? predictedIndex : activeIndex;
  const decoderCenters = useMemo(() => {
    if (predictedIndex === activeIndex) {
      return [activeIndex];
    }
    return [activeIndex, predictedIndex];
  }, [activeIndex, predictedIndex]);

  useEffect(() => {
    if (!effectivePrefetchEnabled) {
      return;
    }
    runFeedPrefetch({
      data,
      activeIndex: prefetchIndex,
      windowSize: effectivePrefetchWindowSize,
      strategy: prefetchStrategy,
      direction: scrollDirectionRef.current,
      initialQuality: effectiveInitialQuality,
      resolveVideoUri,
      maxConcurrent: effectivePrefetchMaxConcurrent,
    });
  }, [
    effectivePrefetchEnabled,
    data,
    prefetchIndex,
    effectivePrefetchWindowSize,
    prefetchStrategy,
    scrollDirection,
    effectiveInitialQuality,
    resolveVideoUri,
    effectivePrefetchMaxConcurrent,
  ]);

  const contextValue = useMemo<FlashReelsContextValue>(
    () => ({
      activeIndex,
      isMuted,
      toggleMute,
      setMuted,
      isPausedGlobally,
    }),
    [activeIndex, isMuted, toggleMute, setMuted, isPausedGlobally]
  );

  const keyExtractor = useCallback((item: T) => item.id, []);

  const refreshControl = useMemo(
    () =>
      refreshEnabled ? (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fff"
          colors={['#fff']}
          progressBackgroundColor="#222"
        />
      ) : undefined,
    [refreshEnabled, refreshing, onRefresh]
  );

  // Decoder mounts follow settled + predicted centers so fling landings warm
  // before viewability settles. Only activeIndex plays unmuted.
  const renderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => (
      <ReelItem
        item={item}
        index={index}
        height={listHeight}
        loop={loop}
        preloadWindowSize={preloadWindowSize}
        isActive={index === activeIndex}
        shouldLoad={shouldLoadReelAround(
          index,
          decoderCenters,
          preloadWindowSize,
          preloadStrategy,
          scrollDirection
        )}
        isMuted={isMuted}
        isPausedGlobally={isPausedGlobally}
        likeIcon={likeIcon}
        bufferConfig={effectiveBufferConfig}
        showProgressBar={showProgressBar}
        progressBarStyle={progressBarStyle}
        showBufferingLoader={showBufferingLoader}
        renderBufferingLoader={renderBufferingLoader}
        showPosterUntilReady={showPosterUntilReady}
        posterBlurRadius={posterBlurRadius}
        initialQuality={effectiveInitialQuality}
        resolveVideoUri={resolveVideoUri}
        videoStyle={videoStyle}
        renderOverlay={renderOverlay}
        renderVideo={renderVideo}
        onLike={onLike}
        onDoubleTap={onDoubleTap}
      />
    ),
    [
      listHeight,
      loop,
      preloadWindowSize,
      preloadStrategy,
      activeIndex,
      decoderCenters,
      scrollDirection,
      isMuted,
      isPausedGlobally,
      likeIcon,
      effectiveBufferConfig,
      showProgressBar,
      progressBarStyle,
      showBufferingLoader,
      renderBufferingLoader,
      showPosterUntilReady,
      posterBlurRadius,
      effectiveInitialQuality,
      resolveVideoUri,
      videoStyle,
      renderOverlay,
      renderVideo,
      onLike,
      onDoubleTap,
    ]
  );

  const extraData = useMemo(
    () => ({
      activeIndex,
      isMuted,
      isPausedGlobally,
      scrollDirection,
      preloadStrategy,
    }),
    [activeIndex, isMuted, isPausedGlobally, scrollDirection, preloadStrategy]
  );

  // pagingEnabled fights snapToInterval on Android and overshoots/sticks;
  // iOS paging pairs well with full-page reels.
  const pagingEnabled = Platform.OS === 'ios';

  return (
    <FlashReelsContext.Provider value={contextValue}>
      <View
        style={[styles.container, containerStyle]}
        onLayout={onContainerLayout}
      >
        {listHeight > 0 ? (
          <FlashList
            ref={listRef}
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            pagingEnabled={pagingEnabled}
            snapToInterval={listHeight}
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            bounces={refreshEnabled}
            overScrollMode={refreshEnabled ? 'auto' : 'never'}
            refreshControl={refreshControl}
            onEndReached={onEndReached}
            onEndReachedThreshold={onEndReachedThreshold}
            ListFooterComponent={ListFooterComponent}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={VIEWABILITY_CONFIG}
            onScroll={onScroll}
            onScrollEndDrag={onScrollEndDrag}
            onMomentumScrollEnd={onMomentumScrollEnd}
            scrollEventThrottle={16}
            extraData={extraData}
            drawDistance={listHeight * drawDistancePages}
            // FlashList v2 recycles via absolute positioning; native
            // removeClippedSubviews detaches Android video surfaces → black frames.
            removeClippedSubviews={false}
          />
        ) : null}
      </View>
    </FlashReelsContext.Provider>
  );
}

export const FlashReels = forwardRef(FlashReelsInner) as <
  T extends ReelData = ReelData,
>(
  props: FlashReelsProps<T> & { ref?: Ref<FlashReelsRef> }
) => ReturnType<typeof FlashReelsInner>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
