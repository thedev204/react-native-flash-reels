import {
  CELLULAR_PREFERRED_PEAK_BITRATE,
  getNetworkAwareDefaults,
  networkKindFromNetInfoType,
} from '../networkAware';

describe('networkKindFromNetInfoType', () => {
  it('maps offline / none', () => {
    expect(networkKindFromNetInfoType('wifi', false)).toEqual({
      kind: 'offline',
      isConnected: false,
    });
    expect(networkKindFromNetInfoType('none', true)).toEqual({
      kind: 'offline',
      isConnected: false,
    });
  });

  it('maps wifi and cellular', () => {
    expect(networkKindFromNetInfoType('wifi', true)).toEqual({
      kind: 'wifi',
      isConnected: true,
    });
    expect(networkKindFromNetInfoType('cellular', true)).toEqual({
      kind: 'cellular',
      isConnected: true,
    });
    expect(networkKindFromNetInfoType('4g', true).kind).toBe('cellular');
  });
});

describe('getNetworkAwareDefaults', () => {
  const base = {
    initialQuality: 'auto' as const,
    prefetchWindowSize: 2,
    prefetchMaxConcurrent: 2,
    hasPreferredPeakBitRate: false,
  };

  it('disables prefetch when offline', () => {
    expect(
      getNetworkAwareDefaults({
        ...base,
        state: { kind: 'offline', isConnected: false },
      })
    ).toMatchObject({
      prefetchEnabled: false,
      prefetchWindowSize: 0,
      prefetchMaxConcurrent: 0,
      initialQuality: 'auto',
    });
  });

  it('forces low quality and shrinks budget on cellular when auto', () => {
    expect(
      getNetworkAwareDefaults({
        ...base,
        state: { kind: 'cellular', isConnected: true },
      })
    ).toEqual({
      initialQuality: 'low',
      prefetchEnabled: true,
      prefetchWindowSize: 1,
      prefetchMaxConcurrent: 1,
      preferredPeakBitRate: CELLULAR_PREFERRED_PEAK_BITRATE,
    });
  });

  it('keeps explicit high quality on cellular', () => {
    expect(
      getNetworkAwareDefaults({
        ...base,
        initialQuality: 'high',
        state: { kind: 'cellular', isConnected: true },
        hasPreferredPeakBitRate: true,
      })
    ).toMatchObject({
      initialQuality: 'high',
      prefetchWindowSize: 1,
      preferredPeakBitRate: undefined,
    });
  });

  it('keeps consumer knobs on wifi', () => {
    expect(
      getNetworkAwareDefaults({
        ...base,
        state: { kind: 'wifi', isConnected: true },
      })
    ).toEqual({
      initialQuality: 'auto',
      prefetchEnabled: true,
      prefetchWindowSize: 2,
      prefetchMaxConcurrent: 2,
    });
  });
});
