ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockoutUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastFailedLoginAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "access_codes" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "userId" TEXT,
  "type" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 10,
  "lastAttemptAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "access_codes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "access_codes_email_type_idx" ON "access_codes"("email", "type");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'access_codes_userId_fkey'
  ) THEN
    ALTER TABLE "access_codes"
      ADD CONSTRAINT "access_codes_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


CREATE TABLE IF NOT EXISTS "rate_limit_buckets" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "resetAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

CREATE TABLE IF NOT EXISTS "security_audit_events" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'security.auth',
  "outcome" TEXT,
  "actorUserId" TEXT,
  "actorRole" "Role",
  "emailHash" TEXT,
  "ip" TEXT,
  "route" TEXT,
  "reason" TEXT,
  "provider" TEXT,
  "resourceType" TEXT,
  "resourceId" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "security_audit_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "security_audit_events_createdAt_idx" ON "security_audit_events"("createdAt");
CREATE INDEX IF NOT EXISTS "security_audit_events_action_createdAt_idx" ON "security_audit_events"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "security_audit_events_actorUserId_createdAt_idx" ON "security_audit_events"("actorUserId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'security_audit_events_actorUserId_fkey'
  ) THEN
    ALTER TABLE "security_audit_events"
      ADD CONSTRAINT "security_audit_events_actorUserId_fkey"
      FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
