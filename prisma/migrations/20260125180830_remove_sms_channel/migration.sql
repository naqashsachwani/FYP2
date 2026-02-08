/*
  Warnings:

  - The values [SMS] on the enum `NotificationChannel` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `frequency` on the `Goal` table. All the data in the column will be lost.
  - You are about to drop the column `nextDepositDate` on the `Goal` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationChannel_new" AS ENUM ('IN_APP', 'EMAIL');
ALTER TABLE "public"."Notification" ALTER COLUMN "channel" DROP DEFAULT;
ALTER TABLE "Notification" ALTER COLUMN "channel" TYPE "NotificationChannel_new" USING ("channel"::text::"NotificationChannel_new");
ALTER TYPE "NotificationChannel" RENAME TO "NotificationChannel_old";
ALTER TYPE "NotificationChannel_new" RENAME TO "NotificationChannel";
DROP TYPE "public"."NotificationChannel_old";
ALTER TABLE "Notification" ALTER COLUMN "channel" SET DEFAULT 'IN_APP';
COMMIT;

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "frequency",
DROP COLUMN "nextDepositDate";

-- DropEnum
DROP TYPE "public"."DepositFrequency";
