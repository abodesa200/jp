-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'TIP';

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN "tipSubmittedAt" TIMESTAMP(3);
