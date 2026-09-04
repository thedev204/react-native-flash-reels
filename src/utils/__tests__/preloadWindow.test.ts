import { isWithinPreloadWindow } from '../preloadWindow';

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
