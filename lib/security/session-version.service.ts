import { JWT } from "next-auth/jwt";
import { AUTH_POLICY } from "@/lib/security/auth-policy";

type SessionVersionUser = {
  sessionVersion?: number;
};

export function primeTokenSessionVersion(token: JWT, user?: SessionVersionUser | null) {
  if (user?.sessionVersion !== undefined) {
    token.sessionVersion = user.sessionVersion;
    token.lastUserSyncAt = 0;
  }
}

export function shouldSyncTokenUser(token: JWT, now = Date.now()) {
  const lastUserSyncAt = typeof token.lastUserSyncAt === "number" ? token.lastUserSyncAt : 0;
  return !lastUserSyncAt || now - lastUserSyncAt >= AUTH_POLICY.session.userSyncMs;
}

export function markTokenSessionValid(token: JWT, sessionVersion: number, now = Date.now()) {
  token.sessionVersion = sessionVersion;
  token.sessionRevoked = false;
  token.lastUserSyncAt = now;
}

export function markTokenSessionRevoked(token: JWT, now = Date.now()) {
  token.isActive = false;
  token.sessionRevoked = true;
  token.lastUserSyncAt = now;
}

export function isTokenSessionVersionRevoked(token: JWT, user: SessionVersionUser) {
  return token.sessionVersion !== undefined && token.sessionVersion !== user.sessionVersion;
}
