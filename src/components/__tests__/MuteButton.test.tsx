import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { MuteButton } from '../MuteButton';
import { FlashReelsContext } from '../../context/FlashReelsContext';

function wrap(ui: ReactNode, overrides: Partial<{ isMuted: boolean }> = {}) {
  const toggleMute = jest.fn();
  const setMuted = jest.fn();

  const tree = render(
    <FlashReelsContext.Provider
      value={{
        activeIndex: 0,
        isMuted: overrides.isMuted ?? false,
        toggleMute,
        setMuted,
        isPausedGlobally: false,
      }}
    >
      {ui}
    </FlashReelsContext.Provider>
  );

  return { ...tree, toggleMute, setMuted };
}

describe('MuteButton', () => {
  it('exposes unmute accessibility when muted', () => {
    wrap(<MuteButton />, { isMuted: true });
    expect(screen.getByLabelText('Unmute')).toBeTruthy();
  });

  it('exposes mute accessibility when unmuted', () => {
    wrap(<MuteButton />, { isMuted: false });
    expect(screen.getByLabelText('Mute')).toBeTruthy();
  });

  it('calls toggleMute on press', () => {
    const { toggleMute } = wrap(<MuteButton />, { isMuted: true });
    fireEvent.press(screen.getByLabelText('Unmute'));
    expect(toggleMute).toHaveBeenCalledTimes(1);
  });
});
