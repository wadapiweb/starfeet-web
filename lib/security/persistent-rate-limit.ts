import prisma from "@/lib/prisma";

type PersistentRateLimitConfig = {
  windowMs: number;
  max: number;
};

type PersistentRateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export async function consumePersistentRateLimit(
  key: string,
  config: PersistentRateLimitConfig,
): Promise<PersistentRateLimitResult> {
  const now = new Date();
  const nextResetAt = new Date(now.getTime() + config.windowMs);

  const bucket = await prisma.$transaction(async (tx) => {
    const current = await tx.rateLimitBucket.findUnique({ where: { key } });

    if (!current || current.resetAt <= now) {
      return tx.rateLimitBucket.upsert({
        where: { key },
        update: { count: 1, resetAt: nextResetAt },
        create: { key, count: 1, resetAt: nextResetAt },
      });
    }

    return tx.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
  });

  const retryAfterSeconds = Math.max(Math.ceil((bucket.resetAt.getTime() - now.getTime()) / 1000), 1);
  const remaining = Math.max(config.max - bucket.count, 0);

  return {
    allowed: bucket.count <= config.max,
    remaining,
    retryAfterSeconds,
  };
}
