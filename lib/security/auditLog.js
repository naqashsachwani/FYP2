import prisma from '@/lib/prisma'

export async function writeSecurityAuditLog({
  action,
  actorUserId = null,
  entityType = null,
  entityId = null,
  status = 'SUCCESS',
  ipAddress = null,
  userAgent = null,
  metadata = null,
}) {
  try {
    if (!prisma.securityAuditLog) {
      return;
    }

    await prisma.securityAuditLog.create({
      data: {
        action,
        actorUserId,
        entityType,
        entityId,
        status,
        ipAddress,
        userAgent,
        metadata: metadata || undefined,
      },
    });
  } catch (error) {
    console.error('Security audit log write failed:', error);
  }
}
