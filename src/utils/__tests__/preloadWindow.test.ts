import {
  isWithinDirectionalPreloadWindow,
  isWithinPreloadWindow,
  shouldLoadReel,
  shouldLoadReelAround,
} from '../preloadWindow';

describe('isWithinPreloadWindow', () => {
  it('includes the active index', () => {
    expect(isWithinPreloadWindow(3, 3, 1)).toBe(true);
  });

  it('includes neighbors within the window size', () => {
    expect(isWithinPreloadWindow(2, 3, 1)).toBe(true);
    expect(isWithinPreloadWindow(4, 3, 1)).toBe(true);
  });

  it('excludes items outside the window', () => {
    expect(isWithinPreloadWindow(1, 3, 1)).toBe(false);
    expect(isWithinPreloadWindow(5, 3, 1)).toBe(false);
  });

  it('supports a wider preload window', () => {
    expect(isWithinPreloadWindow(1, 3, 2)).toBe(true);
    expect(isWithinPreloadWindow(0, 3, 2)).toBe(false);
  });

  it('with window size 0 only keeps the active item', () => {
    expect(isWithinPreloadWindow(0, 0, 0)).toBe(true);
    expect(isWithinPreloadWindow(1, 0, 0)).toBe(false);
  });
});

describe('isWithinDirectionalPreloadWindow', () => {
  it('always includes the active index', () => {
    expect(isWithinDirectionalPreloadWindow(3, 3, 1, 1)).toBe(true);
  });

  it('biases ahead when scrolling forward', () => {
    // window 2 → ahead 2, behind 1
    expect(isWithinDirectionalPreloadWindow(4, 3, 2, 1)).toBe(true);
    expect(isWithinDirectionalPreloadWindow(5, 3, 2, 1)).toBe(true);
    expect(isWithinDirectionalPreloadWindow(2, 3, 2, 1)).toBe(true);
    expect(isWithinDirectionalPreloadWindow(1, 3, 2, 1)).toBe(false);
  });

  it('biases ahead when scrolling backward', () => {
    expect(isWithinDirectionalPreloadWindow(2, 3, 2, -1)).toBe(true);
    expect(isWithinDirectionalPreloadWindow(1, 3, 2, -1)).toBe(true);
    expect(isWithinDirectionalPreloadWindow(4, 3, 2, -1)).toBe(true);
    expect(isWithinDirectionalPreloadWindow(5, 3, 2, -1)).toBe(false);
  });
});

describe('shouldLoadReel', () => {
  it('defaults to symmetric', () => {
    expect(shouldLoadReel(1, 3, 1, 'symmetric', 1)).toBe(false);
    expect(shouldLoadReel(2, 3, 1, 'symmetric', 1)).toBe(true);
  });

  it('supports directional strategy', () => {
    expect(shouldLoadReel(5, 3, 2, 'directional', 1)).toBe(true);
    expect(shouldLoadReel(1, 3, 2, 'directional', 1)).toBe(false);
  });
});

describe('shouldLoadReelAround', () => {
  it('loads neighbors of either active or predicted center', () => {
    // Active at 0 (±1 → 0,1); predicted at 3 (±1 → 2,3,4)
    expect(shouldLoadReelAround(0, [0, 3], 1, 'symmetric', 1)).toBe(true);
    expect(shouldLoadReelAround(1, [0, 3], 1, 'symmetric', 1)).toBe(true);
    expect(shouldLoadReelAround(2, [0, 3], 1, 'symmetric', 1)).toBe(true);
    expect(shouldLoadReelAround(3, [0, 3], 1, 'symmetric', 1)).toBe(true);
    expect(shouldLoadReelAround(4, [0, 3], 1, 'symmetric', 1)).toBe(true);
    // Gap between windows
    expect(shouldLoadReelAround(5, [0, 3], 1, 'symmetric', 1)).toBe(false);
  });

  it('dedupes when centers match', () => {
    expect(shouldLoadReelAround(1, [2, 2], 1, 'symmetric', 1)).toBe(true);
    expect(shouldLoadReelAround(4, [2, 2], 1, 'symmetric', 1)).toBe(false);
  });
});
