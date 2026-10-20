import * as FlashReels from '../index';

describe('public API', () => {
  it('exports the main surface used by consumers', () => {
    expect(FlashReels.FlashReels).toBeDefined();
    expect(FlashReels.MuteButton).toBeDefined();
    expect(FlashReels.useFlashReels).toBeDefined();
    expect(FlashReels.DEFAULT_VIDEO_CACHE_SIZE_MB).toBe(100);
    expect(FlashReels.DEFAULT_PREFETCH_MAX_CONCURRENT).toBe(2);
    expect(FlashReels.isVideoWarmed).toBeDefined();
    expect(FlashReels.predictScrollTarget).toBeDefined();
    expect(FlashReels.getNetworkAwareDefaults).toBeDefined();
    expect(FlashReels.networkKindFromNetInfoType).toBeDefined();
  });
});
