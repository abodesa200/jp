/*
  Warnings:

  - The values [CANCELLED] on the enum `RideStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `discountValue` on the `Coupon` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `maxDiscount` on the `Coupon` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `minFare` on the `Coupon` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `discountApplied` on the `CouponUsage` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to drop the column `isOnline` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `passengerId` on the `Payment` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to drop the column `fare` on the `Ride` table. All the data in the column will be lost.
  - You are about to alter the column `systemFare` on the `Ride` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `clientOffer` on the `Ride` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `discountAmount` on the `Ride` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `finalFare` on the `Ride` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to drop the column `paymentId` on the `RidePassenger` table. All the data in the column will be lost.
  - You are about to alter the column `fare` on the `RidePassenger` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('OFFLINE', 'ONLINE', 'ON_TRIP', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('COMMISSION', 'PAYOUT', 'ADJUSTMENT');

-- AlterEnum
BEGIN;
CREATE TYPE "RideStatus_new" AS ENUM ('REQUESTED', 'ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CLIENT_CANCELLED', 'DRIVER_CANCELLED', 'NO_DRIVER_FOUND', 'EXPIRED');
ALTER TABLE "public"."Ride" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ride" ALTER COLUMN "status" TYPE "RideStatus_new" USING ("status"::text::"RideStatus_new");
ALTER TYPE "RideStatus" RENAME TO "RideStatus_old";
ALTER TYPE "RideStatus_new" RENAME TO "RideStatus";
DROP TYPE "public"."RideStatus_old";
ALTER TABLE "Ride" ALTER COLUMN "status" SET DEFAULT 'REQUESTED';
COMMIT;

-- DropForeignKey
ALTER TABLE "RidePassenger" DROP CONSTRAINT "RidePassenger_paymentId_fkey";

-- DropIndex
DROP INDEX "Notification_createdAt_idx";

-- DropIndex
DROP INDEX "Payment_passengerId_key";

-- DropIndex
DROP INDEX "RidePassenger_paymentId_key";

-- AlterTable
ALTER TABLE "Coupon" ALTER COLUMN "discountValue" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "maxDiscount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "minFare" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "CouponUsage" ALTER COLUMN "discountApplied" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "isOnline",
ADD COLUMN     "commissionRate" DECIMAL(65,30) NOT NULL DEFAULT 0.20,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "status" "DriverStatus" NOT NULL DEFAULT 'OFFLINE';

-- AlterTable
ALTER TABLE "OtpCode" ADD COLUMN     "purpose" TEXT;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "passengerId",
ADD COLUMN     "collectedAt" TIMESTAMP(3),
ADD COLUMN     "collectedByDriver" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Ride" DROP COLUMN "fare",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "negotiatedFare" DECIMAL(65,30),
ALTER COLUMN "systemFare" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "clientOffer" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "discountAmount" SET DATA TYPE DECIMAL(65,30),
ALTER COLUMN "finalFare" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "RidePassenger" DROP COLUMN "paymentId",
ALTER COLUMN "fare" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DriverWallet" (
    "id" SERIAL NOT NULL,
    "driverId" INTEGER NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalEarned" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalDeducted" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT,
    "rideId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverWallet_driverId_key" ON "DriverWallet"("driverId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_rideId_idx" ON "WalletTransaction"("rideId");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "CouponUsage_couponId_idx" ON "CouponUsage"("couponId");

-- CreateIndex
CREATE INDEX "CouponUsage_userId_idx" ON "CouponUsage"("userId");

-- CreateIndex
CREATE INDEX "Driver_status_idx" ON "Driver"("status");

-- CreateIndex
CREATE INDEX "OtpCode_phone_used_expiresAt_idx" ON "OtpCode"("phone", "used", "expiresAt");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Review_driverId_idx" ON "Review"("driverId");

-- CreateIndex
CREATE INDEX "Ride_clientId_idx" ON "Ride"("clientId");

-- CreateIndex
CREATE INDEX "Ride_driverId_idx" ON "Ride"("driverId");

-- CreateIndex
CREATE INDEX "Ride_status_idx" ON "Ride"("status");

-- CreateIndex
CREATE INDEX "RidePassenger_rideId_idx" ON "RidePassenger"("rideId");

-- CreateIndex
CREATE INDEX "RidePassenger_clientId_idx" ON "RidePassenger"("clientId");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "DriverWallet" ADD CONSTRAINT "DriverWallet_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "DriverWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
