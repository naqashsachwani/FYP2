export function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.headers.get('x-real-ip') || 'unknown';
}

export function getRequestContext(request, userId = null) {
  return {
    actorUserId: userId || null,
    ipAddress: getClientIp(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}
