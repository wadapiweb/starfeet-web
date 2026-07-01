import { Role } from "@prisma/client";
import prisma from "@/lib/prisma";
import { AUTH_POLICY } from "@/lib/security/auth-policy";

type LockoutUser = {
  id: string;
  role: Role;
  failedLoginAttempts: number;
  lockoutUntil: Date | null;
};

export function isAccountLocked(user: Pick<LockoutUser, "lockoutUntil">) {
  return Boolean(user.lockoutUntil && user.lockoutUntil.getTime() > Date.now());
}

export async function recordFailedLogin(user: LockoutUser) {
  const nextFailedAttempts = user.failedLoginAttempts + 1;
  const shouldLock = nextFailedAttempts >= AUTH_POLICY.credentials.maxFailedAttempts;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: nextFailedAttempts,
      lastFailedLoginAt: new Date(),
      ...(shouldLock
        ? { lockoutUntil: new Date(Date.now() + AUTH_POLICY.credentials.lockoutWindowMs) }
        : {}),
    },
  });

  return { nextFailedAttempts, shouldLock };
}

export async function recordSuccessfulLogin(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lockoutUntil: null,
      lastLoginAt: new Date(),
    },
  });
}
