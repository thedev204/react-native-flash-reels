import { useFlashReelsContext } from '../context/FlashReelsContext';

/**
 * Read mute + active index from inside a custom `renderOverlay`.
 * Avoids prop-drilling through the overlay tree.
 */
export function useFlashReels() {
  const { activeIndex, isMuted, toggleMute, setMuted } = useFlashReelsContext();
  return { activeIndex, isMuted, toggleMute, setMuted };
}
