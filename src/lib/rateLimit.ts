/**
 * In-memory sliding window rate limiter.
 *
 * Each entry in the store maps a key (client IP + route) to an array of
 * request timestamps (in ms) within the current window.
 *
 * NOTE: This state is local to a single Node.js process. It resets on
 * server restart and does not coordinate across multiple instances.
 */

interface RateLimitOptions {
  /** Maximum number of requests allowed within the window. */
  limit: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

// Shared store: key → array of timestamps
const store = new Map<string, number[]>();

/**
 * Check whether a request identified by `key` is within the rate limit.
 *
 * @returns `{ allowed: true }` when the request may proceed, or
 *          `{ allowed: false, retryAfterMs: number }` when the limit is exceeded.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  // Retrieve and prune timestamps outside the current window
  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length === 0) {
    store.delete(key);
  }

  if (timestamps.length >= options.limit) {
    // Earliest timestamp in the window — client can retry once it expires
    const retryAfterMs = timestamps[0] + options.windowMs - now;
    store.set(key, timestamps);
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 0) };
  }

  timestamps.push(now);
  store.set(key, timestamps);
  return { allowed: true };
}

/**
 * Extract the client IP from a Next.js Request object.
 * Checks x-forwarded-for first (first IP in the chain), then x-real-ip,
 * and falls back to "unknown" so the limiter still functions without headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}
