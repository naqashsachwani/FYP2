CREATE INDEX "Goal_userId_status_idx" ON "Goal"("userId", "status");

CREATE INDEX "Delivery_status_updatedAt_idx" ON "Delivery"("status", "updatedAt");

CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

CREATE INDEX "Escrow_status_updatedAt_idx" ON "Escrow"("status", "updatedAt");

CREATE INDEX "Escrow_status_releasedAt_idx" ON "Escrow"("status", "releasedAt");

CREATE INDEX "RefundRequest_status_updatedAt_idx" ON "RefundRequest"("status", "updatedAt");
