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
import type { FlashReelsProps, FlashReelsRef, ReelData } from '../types';
import { runFeedPrefetch, type ScrollDirection } from '../utils/prefetch';
import { isWithinPreloadWindow } from '../utils/preloadWindow';
import { resolveBufferConfig } from '../utils/resolveBufferConfig';
import { ReelItem } from './ReelItem';

const VIEWABILITY_CONFIG = {
  // Slightly lower than 60 so a light page flick still settles the active index.
  itemVisiblePercentThreshold: 50,
  waitForInteraction: false,
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
    prefetchEnabled = false,
    prefetchWindowSize = 2,
    prefetchStrategy = 'directional',
    showPosterUntilReady = false,
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
  const [uncontrolledMuted, setUncontrolledMuted] = useState(defaultMuted);
  const [isPausedGlobally, setIsPausedGlobally] = useState(false);
  const scrollDirectionRef = useRef<ScrollDirection>(1);

  const isControlled = mutedProp !== undefined;
  const isMuted = isControlled ? mutedProp : uncontrolledMuted;
  const refreshEnabled = onRefresh != null;

  const effectiveBufferConfig = useMemo(
    () => resolveBufferConfig(bufferConfig, videoCacheEnabled),
    [bufferConfig, videoCacheEnabled]
  );

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
          scrollDirectionRef.current = 1;
        } else if (nextIndex < prev) {
          scrollDirectionRef.current = -1;
        }
        onIndexChange?.(nextIndex);
        return nextIndex;
      });
    },
    [onIndexChange]
  );

  useEffect(() => {
    if (!prefetchEnabled) {
      return;
    }
    runFeedPrefetch({
      data,
      activeIndex,
      windowSize: prefetchWindowSize,
      strategy: prefetchStrategy,
      direction: scrollDirectionRef.current,
      initialQuality,
      resolveVideoUri,
    });
  }, [
    prefetchEnabled,
    data,
    activeIndex,
    prefetchWindowSize,
    prefetchStrategy,
    initialQuality,
    resolveVideoUri,
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

  // renderItem reads activeIndex / isMuted / isPausedGlobally from closure so
  // each ReelItem receives only the props it needs — no context subscription.
  const renderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => (
      <ReelItem
        item={item}
        index={index}
        height={listHeight}
        loop={loop}
        preloadWindowSize={preloadWindowSize}
        isActive={index === activeIndex}
        shouldLoad={isWithinPreloadWindow(
          index,
          activeIndex,
          preloadWindowSize
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
        initialQuality={initialQuality}
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
      activeIndex,
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
      initialQuality,
      resolveVideoUri,
      videoStyle,
      renderOverlay,
      renderVideo,
      onLike,
      onDoubleTap,
    ]
  );

  // Only values that should trigger a full re-render pass on the list.
  // activeIndex is already handled via renderItem deps; listHeight rarely changes.
  const extraData = useMemo(
    () => ({ activeIndex, isMuted, isPausedGlobally }),
    [activeIndex, isMuted, isPausedGlobally]
  );

  // Android pagingEnabled on FlashList has historically been jumpy; snap by
  // interval matches the measured page height more reliably.
  const pagingEnabled = Platform.OS === 'ios';

  return (
    <FlashReelsContext.Provider value={contextValue}>
      <View
        style={[styles.container, containerStyle]}
        onLayout={onContainerLayout}
      >
        <FlashList
          ref={listRef}
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          pagingEnabled={pagingEnabled}
          snapToInterval={listHeight}
          snapToAlignment="start"
          disableIntervalMomentum
          decelerationRate={Platform.OS === 'ios' ? 'fast' : 0.98}
          showsVerticalScrollIndicator={false}
          bounces={refreshEnabled}
          overScrollMode={refreshEnabled ? 'auto' : 'never'}
          refreshControl={refreshControl}
          onEndReached={onEndReached}
          onEndReachedThreshold={onEndReachedThreshold}
          ListFooterComponent={ListFooterComponent}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={VIEWABILITY_CONFIG}
          extraData={extraData}
          drawDistance={listHeight * (preloadWindowSize + 1)}
          // FlashList v2 recycles via absolute positioning; native
          // removeClippedSubviews detaches Android video surfaces → black frames.
          removeClippedSubviews={false}
        />
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
