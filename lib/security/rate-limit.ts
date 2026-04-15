type RateLimitWindow = {
  count: number;
  resetAt: number;
};

type RateLimitConfig = {
  windowMs: number;
  max: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type InternalStore = Map<string, RateLimitWindow>;

const RATE_LIMIT_STORE_KEY = "__starfeet_rate_limit_store__";

function getStore(): InternalStore {
  const target = globalThis as typeof globalThis & {
    [RATE_LIMIT_STORE_KEY]?: InternalStore;
  };

  if (!target[RATE_LIMIT_STORE_KEY]) {
    target[RATE_LIMIT_STORE_KEY] = new Map<string, RateLimitWindow>();
  }

  return target[RATE_LIMIT_STORE_KEY] as InternalStore;
}

function cleanupStore(now: number, store: InternalStore) {
  if (store.size < 5000) return;
  for (const [key, window] of store.entries()) {
    if (window.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function consumeRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const store = getStore();

  cleanupStore(now, store);

  const current = store.get(key);
  const hasExpired = !current || current.resetAt <= now;

  if (hasExpired) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(config.max - 1, 0),
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  current.count += 1;
  store.set(key, current);

  const remaining = Math.max(config.max - current.count, 0);
  const retryAfterSeconds = Math.max(Math.ceil((current.resetAt - now) / 1000), 1);

  return {
    allowed: current.count <= config.max,
    remaining,
    retryAfterSeconds,
  };
}

export function readClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}
