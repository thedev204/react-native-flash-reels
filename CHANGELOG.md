# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
