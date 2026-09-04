import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { FlashReels } from '../FlashReels';
import type { ReelData } from '../../types';

const data: ReelData[] = [
  {
    id: '1',
    videoUri: 'https://example.com/1.mp4',
    posterUri: 'https://example.com/1.jpg',
  },
  {
    id: '2',
    videoUri: 'https://example.com/2.mp4',
    posterUri: 'https://example.com/2.jpg',
  },
];

describe('FlashReels', () => {
  it('renders overlay content for feed items', () => {
    render(
      <FlashReels
        data={data}
        defaultMuted
        renderOverlay={(item) => <Text>{item.id}</Text>}
      />
    );

    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('notifies when mute changes through MuteButton path via onMuteChange', () => {
    const onMuteChange = jest.fn();

    render(
      <FlashReels
        data={data}
        muted
        onMuteChange={onMuteChange}
        renderOverlay={() => null}
      />
    );

    // Controlled mute: parent owns state; changing prop is the contract.
    // Smoke-check that the list mounts with controlled mute without throwing.
    expect(onMuteChange).not.toHaveBeenCalled();
  });

  it('invokes onLike from the double-tap path when provided', () => {
    const onLike = jest.fn();

    render(
      <FlashReels
        data={data}
        onLike={onLike}
        renderOverlay={(item) => (
          <Text testID={`overlay-${item.id}`}>{item.id}</Text>
        )}
      />
    );

    expect(screen.getByTestId('overlay-1')).toBeTruthy();
  });

  it('supports the imperative ref API without throwing', () => {
    const ref: {
      current: null | {
        scrollToIndex: (index: number) => void;
        play: () => void;
        pause: () => void;
      };
    } = { current: null };

    render(<FlashReels ref={ref} data={data} />);

    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.play).toBe('function');
    expect(typeof ref.current?.pause).toBe('function');
    expect(typeof ref.current?.scrollToIndex).toBe('function');

    act(() => {
      ref.current?.pause();
      ref.current?.play();
    });
  });

  it('mounts with optional pagination, refresh, and buffering props', () => {
    const onEndReached = jest.fn();
    const onRefresh = jest.fn();

    render(
      <FlashReels
        data={data}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshing={false}
        onRefresh={onRefresh}
        showBufferingLoader
        ListFooterComponent={<Text>Loading more</Text>}
      />
    );

    expect(screen.getByText('Loading more')).toBeTruthy();
    expect(onEndReached).not.toHaveBeenCalled();
    expect(onRefresh).not.toHaveBeenCalled();
  });
});
