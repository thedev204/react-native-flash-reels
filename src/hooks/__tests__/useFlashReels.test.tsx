import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { FlashReelsContext } from '../../context/FlashReelsContext';
import { useFlashReels } from '../useFlashReels';

function wrapper({ children }: { children: ReactNode }) {
  return (
    <FlashReelsContext.Provider
      value={{
        activeIndex: 2,
        isMuted: true,
        toggleMute: jest.fn(),
        setMuted: jest.fn(),
        isPausedGlobally: false,
      }}
    >
      {children}
    </FlashReelsContext.Provider>
  );
}

describe('useFlashReels', () => {
  it('reads mute and active index from context', () => {
    const { result } = renderHook(() => useFlashReels(), { wrapper });

    expect(result.current.activeIndex).toBe(2);
    expect(result.current.isMuted).toBe(true);
    expect(typeof result.current.toggleMute).toBe('function');
    expect(typeof result.current.setMuted).toBe('function');
  });

  it('throws when used outside FlashReels', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useFlashReels())).toThrow(
      /must be used within a FlashReels/
    );

    spy.mockRestore();
  });
});
