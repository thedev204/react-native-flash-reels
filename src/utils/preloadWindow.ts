/**
 * Only the active item and a small neighborhood should hold a real video
 * source. Everything else stays poster-only so we don't exhaust hardware
 * decoders (especially limited on Android).
 */
export function isWithinPreloadWindow(
  index: number,
  activeIndex: number,
  windowSize: number
): boolean {
  return Math.abs(index - activeIndex) <= windowSize;
}
