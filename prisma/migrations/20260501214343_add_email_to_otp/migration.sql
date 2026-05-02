-- AlterTable
ALTER TABLE "OtpCode" ADD COLUMN     "email" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;
