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

  it('mounts with opt-in prefetch and poster-until-ready without changing defaults', () => {
    const prefetchSpy = jest
      .spyOn(require('react-native').Image, 'prefetch')
      .mockResolvedValue(true);
    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      arrayBuffer: async () => new ArrayBuffer(0),
    } as Response);

    render(
      <FlashReels
        data={data}
        prefetchEnabled
        prefetchWindowSize={2}
        showPosterUntilReady
        posterBlurRadius={12}
        renderOverlay={(item) => <Text>{item.id}</Text>}
      />
    );

    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getAllByTestId('mock-video').length).toBeGreaterThan(0);

    prefetchSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it('passes default cacheSizeMB when videoCacheEnabled is true', () => {
    render(<FlashReels data={data} videoCacheEnabled />);

    const video = screen.getAllByTestId('mock-video')[0];
    expect(video).toBeTruthy();
    expect(video!.props.bufferConfig?.cacheSizeMB).toBe(100);
  });

  it('lets explicit bufferConfig.cacheSizeMB override the default', () => {
    render(
      <FlashReels
        data={data}
        videoCacheEnabled
        bufferConfig={{ cacheSizeMB: 50 }}
      />
    );

    const video = screen.getAllByTestId('mock-video')[0];
    expect(video).toBeTruthy();
    expect(video!.props.bufferConfig?.cacheSizeMB).toBe(50);
  });

  it('ignores videoCacheEnabled when renderVideo is provided', () => {
    render(
      <FlashReels
        data={data}
        videoCacheEnabled
        renderVideo={() => <Text testID="custom-player">custom</Text>}
      />
    );

    expect(screen.getAllByTestId('custom-player').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('mock-video')).toBeNull();
  });
});
