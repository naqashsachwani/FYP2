## Security Notes

### Secret Rotation

Application code cannot rotate provider-side secrets automatically. Rotate these manually in their platforms and then update your deployment environment:

- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `IMAGEKIT_PRIVATE_KEY`
- `EMAIL_PASS`

### Admin Hardening

- Admin access now supports role metadata in Clerk (`publicMetadata.role` or `privateMetadata.role`)
- MFA is required for admins unless `ADMIN_REQUIRE_MFA=false`

### Database Changes

- Added `SecurityAuditLog` for append-only security and transaction event tracking
