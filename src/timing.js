// @ts-check

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<{ result: T, durationMs: number }>}
 */
export async function withTiming(fn) {
  const start = performance.now();
  const result = await fn();
  return { result, durationMs: performance.now() - start };
}
