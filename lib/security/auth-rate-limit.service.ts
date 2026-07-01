import { AUTH_POLICY } from "@/lib/security/auth-policy";
import { consumePersistentRateLimit } from "@/lib/security/persistent-rate-limit";

export function consumeCredentialsRateLimit(ip: string, email: string) {
  return consumePersistentRateLimit(`auth:credentials:${ip}:${email}`, {
    windowMs: AUTH_POLICY.credentials.rateLimitWindowMs,
    max: AUTH_POLICY.credentials.rateLimitMax,
  });
}

export function consumeRegisterRateLimit(ip: string) {
  return consumePersistentRateLimit(`auth:register:${ip}`, {
    windowMs: AUTH_POLICY.register.rateLimitWindowMs,
    max: AUTH_POLICY.register.rateLimitMax,
  });
}

export function consumePasswordResetRequestRateLimit(ip: string, email: string) {
  return consumePersistentRateLimit(`auth:forgot-password:${ip}:${email}`, {
    windowMs: AUTH_POLICY.passwordReset.requestWindowMs,
    max: AUTH_POLICY.passwordReset.requestMax,
  });
}

export function consumePasswordResetVerifyRateLimit(ip: string, email: string) {
  return consumePersistentRateLimit(`auth:reset-password:${ip}:${email}`, {
    windowMs: AUTH_POLICY.passwordReset.verifyWindowMs,
    max: AUTH_POLICY.passwordReset.verifyMax,
  });
}

export function consumeGuestAccessRequestRateLimit(ip: string, email: string) {
  return consumePersistentRateLimit(`auth:guest-request:${ip}:${email}`, {
    windowMs: AUTH_POLICY.guestAccess.requestWindowMs,
    max: AUTH_POLICY.guestAccess.requestMax,
  });
}

export function consumeGuestAccessVerifyRateLimit(ip: string, email: string) {
  return consumePersistentRateLimit(`auth:guest-verify:${ip}:${email}`, {
    windowMs: AUTH_POLICY.guestAccess.verifyWindowMs,
    max: AUTH_POLICY.guestAccess.verifyMax,
  });
}
