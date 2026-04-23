CREATE TABLE "SecurityAuditLog" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorUserId" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SUCCESS',
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SecurityAuditLog_actorUserId_idx" ON "SecurityAuditLog"("actorUserId");
CREATE INDEX "SecurityAuditLog_action_idx" ON "SecurityAuditLog"("action");
CREATE INDEX "SecurityAuditLog_entityType_entityId_idx" ON "SecurityAuditLog"("entityType", "entityId");
CREATE INDEX "SecurityAuditLog_createdAt_idx" ON "SecurityAuditLog"("createdAt");
