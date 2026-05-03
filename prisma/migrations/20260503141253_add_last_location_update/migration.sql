-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "lastLocationUpdate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "OtpCode_email_used_expiresAt_idx" ON "OtpCode"("email", "used", "expiresAt");
