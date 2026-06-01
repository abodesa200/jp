-- AlterTable
ALTER TABLE "RidePassenger" ADD COLUMN "tip" DECIMAL(65,30) DEFAULT 0;
ALTER TABLE "RidePassenger" ADD COLUMN "tipSubmittedAt" TIMESTAMP(3);
