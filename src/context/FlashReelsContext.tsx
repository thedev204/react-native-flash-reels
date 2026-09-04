import { createContext, useContext } from 'react';

export interface FlashReelsContextValue {
  activeIndex: number;
  isMuted: boolean;
  toggleMute: () => void;
  setMuted: (muted: boolean) => void;
  /** Global play/pause override from the imperative ref API. */
  isPausedGlobally: boolean;
}

const FlashReelsContext = createContext<FlashReelsContextValue | null>(null);

export function useFlashReelsContext(): FlashReelsContextValue {
  const value = useContext(FlashReelsContext);
  if (value == null) {
    throw new Error(
      'useFlashReels must be used within a FlashReels component (or its renderOverlay tree).'
    );
  }
  return value;
}

export { FlashReelsContext };
