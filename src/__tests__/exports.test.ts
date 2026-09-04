import * as FlashReels from '../index';

describe('public API', () => {
  it('exports the main surface used by consumers', () => {
    expect(FlashReels.FlashReels).toBeDefined();
    expect(FlashReels.MuteButton).toBeDefined();
    expect(FlashReels.useFlashReels).toBeDefined();
  });
});
