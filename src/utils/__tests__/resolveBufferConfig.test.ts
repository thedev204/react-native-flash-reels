import {
  DEFAULT_VIDEO_CACHE_SIZE_MB,
  type VideoBufferConfig,
} from '../../types';
import { resolveBufferConfig } from '../resolveBufferConfig';

describe('resolveBufferConfig', () => {
  it('returns undefined when cache and bufferConfig are off', () => {
    expect(resolveBufferConfig(undefined, false)).toBeUndefined();
  });

  it('defaults cacheSizeMB when videoCacheEnabled is true', () => {
    expect(resolveBufferConfig(undefined, true)).toEqual({
      cacheSizeMB: DEFAULT_VIDEO_CACHE_SIZE_MB,
    });
  });

  it('lets explicit cacheSizeMB win over the default', () => {
    const bufferConfig: VideoBufferConfig = { cacheSizeMB: 50 };
    expect(resolveBufferConfig(bufferConfig, true)).toEqual({
      cacheSizeMB: 50,
    });
  });

  it('allows cacheSizeMB 0 to force cache off while keeping other knobs', () => {
    expect(
      resolveBufferConfig({ minBufferMs: 3000, cacheSizeMB: 0 }, true)
    ).toEqual({
      minBufferMs: 3000,
      cacheSizeMB: 0,
    });
  });

  it('preserves other buffer fields when enabling cache', () => {
    expect(resolveBufferConfig({ maxBufferMs: 8000 }, true)).toEqual({
      maxBufferMs: 8000,
      cacheSizeMB: DEFAULT_VIDEO_CACHE_SIZE_MB,
    });
  });
});
