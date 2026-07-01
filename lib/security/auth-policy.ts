export const AUTH_POLICY = {
  credentials: {
    rateLimitWindowMs: 10 * 60 * 1000,
    rateLimitMax: 20,
    maxFailedAttempts: 5,
    lockoutWindowMs: 15 * 60 * 1000,
  },
  register: {
    rateLimitWindowMs: 15 * 60 * 1000,
    rateLimitMax: 12,
  },
  passwordReset: {
    requestWindowMs: 15 * 60 * 1000,
    requestMax: 6,
    verifyWindowMs: 15 * 60 * 1000,
    verifyMax: 10,
  },
  guestAccess: {
    requestWindowMs: 15 * 60 * 1000,
    requestMax: 6,
    verifyWindowMs: 15 * 60 * 1000,
    verifyMax: 10,
  },
  session: {
    userSyncMs: 15 * 1000,
  },
} as const;
