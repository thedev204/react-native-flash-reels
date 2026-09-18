import { DEFAULT_VIDEO_CACHE_SIZE_MB, type VideoBufferConfig } from '../types';

/**
 * Merge `videoCacheEnabled` with optional `bufferConfig`.
 * Returns undefined when neither buffering knobs nor cache are requested.
 */
export function resolveBufferConfig(
  bufferConfig: VideoBufferConfig | undefined,
  videoCacheEnabled: boolean
): VideoBufferConfig | undefined {
  const hasBufferConfig = bufferConfig != null;
  if (!hasBufferConfig && !videoCacheEnabled) {
    return undefined;
  }

  const next: VideoBufferConfig = { ...bufferConfig };

  if (bufferConfig?.cacheSizeMB !== undefined) {
    next.cacheSizeMB = bufferConfig.cacheSizeMB;
  } else if (videoCacheEnabled) {
    next.cacheSizeMB = DEFAULT_VIDEO_CACHE_SIZE_MB;
  }

  return next;
}
