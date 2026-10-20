# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.4.0] - 2026-10-20

### Added

- Mid-fling **scroll prediction** — prefetch / decoder warm-up from offset + velocity; playback still settles via viewability.
- Decoder window **unions** `activeIndex` + `predictedIndex` so the landing page mounts before settle.
- Muted **first-frame warmup** for preloaded neighbors (unblocks `onReadyForDisplay` on Android).
- `drawDistancePages` — FlashList draw distance independent of the decoder window (default `preloadWindowSize + 1`).
- `preloadStrategy` (`symmetric` \| `directional`) — optional directional decoder slots ahead of scroll.
- Prefetch **concurrency cap** (`prefetchMaxConcurrent`, default `2`), poster-first warm-up, and abortable video Range fetches.
- Optional `networkAware` + optional peer `@react-native-community/netinfo` for cellular/offline start-quality and prefetch budgets.
- Exported helpers: `predictScrollTarget`, `getNetworkAwareDefaults`, `networkKindFromNetInfoType`, `DEFAULT_PREFETCH_MAX_CONCURRENT`.

### Changed

- `showPosterUntilReady` now defaults to **`true`**. Built-in player covers the surface with a poster overlay until `onReadyForDisplay` / first `onProgress` (never toggles Video `opacity` — that caused permanent black frames on Android).
- Full-page snap: `pagingEnabled` on iOS; Android uses `snapToInterval` + `decelerationRate="fast"`. Settle-to-nearest-page runs on momentum end (and drag-end only when there is no fling velocity) so flings are not cancelled.
- Example app migrated from bare React Native to **Expo**.

### Fixed

- Scroll feeling stuck / requiring a full-page drag — settle no longer runs on `onScrollEndDrag` while momentum is in flight.
- Poster flashing then black screen — ready fallback no longer clears the cover on bare `onLoad`; Video `opacity: 0` gating removed.
- Prefetched / preloaded reels showing poster + loader before play — neighbors warm muted until the first frame (no remount on activate); buffering spinner only for mid-playback rebuffers; Android uses `TextureView` so covers do not suppress ready events.

---

## [0.3.0] - 2026-09-18

### Added

- Opt-in RN Video **disk cache** via `videoCacheEnabled` (default **100 MB**) and `bufferConfig.cacheSizeMB`.
- Exported `DEFAULT_VIDEO_CACHE_SIZE_MB` for consumers that want the same default.
- Installation docs for iOS `$RNVideoUseVideoCaching` Podfile flag.
- Expanded Performance guide: prefetch vs decoder preload, poster-first, ABR ladders, CDN checklist, feed ranking, disk cache.

### Fixed

- Permanent **black video** on Android when `removeClippedSubviews` was enabled with FlashList v2 — now always off.
- Video surface no longer wrapped in `GestureDetector` (transparent gesture layer instead) to avoid blank Android surfaces.
- `showPosterUntilReady` no longer covers the player with a dark fallback when `posterUri` is missing; clears waiting state on `onLoad` if `onReadyForDisplay` is flaky.

### Docs

- README quick start and Performance section for prefetch / poster-first / disk cache.
- Website intro, usage, props, types, and performance pages aligned with the new APIs.

---

## [0.2.0] - 2026-09-09

### Added

- Opt-in HTTP/poster **prefetch** (`prefetchEnabled`, `prefetchWindowSize`, `prefetchStrategy`) independent of the decoder preload window.
- Opt-in **poster / blur-first** until first frame (`showPosterUntilReady`, `posterBlurRadius`).
- Optional progressive **quality ladder** on `ReelData` (`qualities`, `initialQuality`, `resolveVideoUri`).
- Optional `prefetchPriority` on feed items for ranked warm-up order.
- ABR-oriented buffer hints on `VideoBufferConfig` (`preferredPeakBitRate`, `preferredMaximumResolution`).
- Performance docs covering HLS ABR, tiny first chunk, CDN/edge caching, and app-owned feed ranking.

---

## [0.1.0] - 2026-09-04

### Added

- Initial release of **react-native-flash-reels**.
- `FlashReels` vertical snap feed built on FlashList v2 (New Architecture).
- Auto play/pause from viewability, with single-tap pause/play override.
- Double-tap like with heart animation (`onLike` / `onDoubleTap`).
- Global mute — controlled (`muted` / `onMuteChange`) or uncontrolled (`defaultMuted`).
- `MuteButton` and `useFlashReels` for overlay mute state.
- Optional Instagram-style progress bar (`showProgressBar` + `ReelData.duration`).
- Optional pagination (`onEndReached`) and pull-to-refresh (`onRefresh`).
- Optional buffering loader (`showBufferingLoader` / `renderBufferingLoader`).
- Custom overlay and video engine via `renderOverlay` / `renderVideo`.
- Preload window (`preloadWindowSize`) to limit concurrent video decoders.
- Imperative ref API: `scrollToIndex`, `pause`, `play`.
- Example app with custom overlay and comments bottom sheet.
- Documentation site (Docusaurus) with API reference and guides.
