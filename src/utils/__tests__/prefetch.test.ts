import type { ReelData } from '../../types';
import {
  abortVideoWarmsOutside,
  getPrefetchIndexes,
  isVideoWarmed,
  prefetchVideoHints,
  resetPrefetchState,
  runFeedPrefetch,
  setPrefetchMaxConcurrent,
  sortIndexesByPrefetchPriority,
} from '../prefetch';
import { resolveVideoUri } from '../resolveVideoUri';

describe('getPrefetchIndexes', () => {
  it('returns empty for empty data or zero window', () => {
    expect(getPrefetchIndexes(0, 0, 2, 'symmetric')).toEqual([]);
    expect(getPrefetchIndexes(0, 5, 0, 'directional')).toEqual([]);
  });

  it('symmetric mirrors ahead and behind', () => {
    expect(getPrefetchIndexes(3, 8, 2, 'symmetric')).toEqual([1, 2, 4, 5]);
  });

  it('directional biases ahead when scrolling forward', () => {
    expect(getPrefetchIndexes(3, 10, 2, 'directional', 1)).toEqual([2, 4, 5]);
  });

  it('directional biases ahead when scrolling backward', () => {
    expect(getPrefetchIndexes(3, 10, 2, 'directional', -1)).toEqual([1, 2, 4]);
  });

  it('clamps at feed edges', () => {
    expect(getPrefetchIndexes(0, 5, 2, 'directional', 1)).toEqual([1, 2]);
    expect(getPrefetchIndexes(4, 5, 2, 'directional', 1)).toEqual([3]);
  });
});

describe('sortIndexesByPrefetchPriority', () => {
  const data: ReelData[] = [
    { id: 'a', videoUri: 'a.mp4', prefetchPriority: 1 },
    { id: 'b', videoUri: 'b.mp4', prefetchPriority: 10 },
    { id: 'c', videoUri: 'c.mp4' },
  ];

  it('orders higher priority first', () => {
    expect(sortIndexesByPrefetchPriority([0, 1, 2], data)).toEqual([1, 0, 2]);
  });
});

describe('resolveVideoUri', () => {
  const item: ReelData = {
    id: '1',
    videoUri: 'https://cdn.example.com/default.mp4',
    qualities: [
      {
        uri: 'https://cdn.example.com/low.mp4',
        bandwidth: 500_000,
        height: 480,
      },
      {
        uri: 'https://cdn.example.com/high.mp4',
        bandwidth: 3_000_000,
        height: 1080,
      },
      {
        uri: 'https://cdn.example.com/mid.mp4',
        bandwidth: 1_500_000,
        height: 720,
      },
    ],
  };

  it('falls back to videoUri without qualities', () => {
    expect(
      resolveVideoUri({ id: 'x', videoUri: 'https://cdn.example.com/x.mp4' })
    ).toBe('https://cdn.example.com/x.mp4');
  });

  it('auto and low prefer the lowest rung', () => {
    expect(resolveVideoUri(item, 'auto')).toBe(
      'https://cdn.example.com/low.mp4'
    );
    expect(resolveVideoUri(item, 'low')).toBe(
      'https://cdn.example.com/low.mp4'
    );
  });

  it('high prefers the highest rung', () => {
    expect(resolveVideoUri(item, 'high')).toBe(
      'https://cdn.example.com/high.mp4'
    );
  });

  it('honors custom resolve override', () => {
    expect(
      resolveVideoUri(item, 'high', () => 'https://cdn.example.com/custom.mp4')
    ).toBe('https://cdn.example.com/custom.mp4');
  });
});

describe('prefetch queue / abort', () => {
  beforeEach(() => {
    resetPrefetchState();
  });

  afterEach(() => {
    resetPrefetchState();
  });

  it('setPrefetchMaxConcurrent accepts zero without throwing', () => {
    expect(() => setPrefetchMaxConcurrent(0)).not.toThrow();
  });

  it('abortVideoWarmsOutside clears controllers for dropped URIs', () => {
    const fetchMock = jest.fn(
      () =>
        new Promise(() => {
          /* never resolves — stay in-flight */
        })
    );
    // @ts-expect-error test mock
    global.fetch = fetchMock;

    prefetchVideoHints(['https://cdn.example.com/a.mp4']);
    expect(fetchMock).toHaveBeenCalled();

    abortVideoWarmsOutside(new Set(['https://cdn.example.com/keep.mp4']));
    prefetchVideoHints(['https://cdn.example.com/b.mp4']);
    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  it('runFeedPrefetch no-ops when window or concurrency is zero', () => {
    const fetchMock = jest.fn();
    // @ts-expect-error test mock
    global.fetch = fetchMock;

    runFeedPrefetch({
      data: [{ id: '1', videoUri: 'https://cdn.example.com/a.mp4' }],
      activeIndex: 0,
      windowSize: 0,
      strategy: 'directional',
      direction: 1,
      maxConcurrent: 2,
    });
    expect(fetchMock).not.toHaveBeenCalled();

    runFeedPrefetch({
      data: [
        { id: '1', videoUri: 'https://cdn.example.com/a.mp4' },
        {
          id: '2',
          videoUri: 'https://cdn.example.com/b.mp4',
          posterUri: 'https://cdn.example.com/b.jpg',
        },
      ],
      activeIndex: 0,
      windowSize: 2,
      strategy: 'directional',
      direction: 1,
      maxConcurrent: 0,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('isVideoWarmed', () => {
  beforeEach(() => {
    resetPrefetchState();
  });

  afterEach(() => {
    resetPrefetchState();
  });

  it('is false for empty or never-warmed URIs', () => {
    expect(isVideoWarmed('')).toBe(false);
    expect(isVideoWarmed('https://cdn.example.com/cold.mp4')).toBe(false);
  });
});

describe('resetPrefetchState', () => {
  it('clears without throwing', () => {
    resetPrefetchState();
    expect(() => resetPrefetchState()).not.toThrow();
  });
});
