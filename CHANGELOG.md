# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
