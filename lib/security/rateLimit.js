const globalStore = globalThis.__dreamsaverRateLimitStore || new Map();

if (!globalThis.__dreamsaverRateLimitStore) {
  globalThis.__dreamsaverRateLimitStore = globalStore;
}

export function checkRateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  const entry = globalStore.get(key);

  if (!entry || entry.expiresAt <= now) {
    globalStore.set(key, {
      count: 1,
      expiresAt: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, entry.expiresAt - now),
    };
  }

  entry.count += 1;
  globalStore.set(key, entry);

  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.count),
    retryAfterMs: 0,
  };
}
