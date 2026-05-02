/*
  Warnings:

  - The values [DRIVER] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Driver` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Driver` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Negotiation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Negotiation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `NegotiationOffer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `NegotiationOffer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `OtpCode` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `OtpCode` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Payment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `passengerId` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Review` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Review` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Ride` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Ride` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `driverId` column on the `Ride` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `RidePassenger` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `RidePassenger` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paymentId` column on the `RidePassenger` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `SupportTicket` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `SupportTicket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `rideId` on the `Negotiation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `negotiationId` on the `NegotiationOffer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `rideId` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `rideId` on the `Review` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `driverId` on the `Review` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `rideId` on the `RidePassenger` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('CLIENT', 'ADMIN', 'CUSTOMER_SUPPORT');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CLIENT';
COMMIT;

-- DropForeignKey
ALTER TABLE "Negotiation" DROP CONSTRAINT "Negotiation_rideId_fkey";

-- DropForeignKey
ALTER TABLE "NegotiationOffer" DROP CONSTRAINT "NegotiationOffer_negotiationId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_rideId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_driverId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_rideId_fkey";

-- DropForeignKey
ALTER TABLE "Ride" DROP CONSTRAINT "Ride_driverId_fkey";

-- DropForeignKey
ALTER TABLE "RidePassenger" DROP CONSTRAINT "RidePassenger_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "RidePassenger" DROP CONSTRAINT "RidePassenger_rideId_fkey";

-- AlterTable
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Driver_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Negotiation" DROP CONSTRAINT "Negotiation_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "rideId",
ADD COLUMN     "rideId" INTEGER NOT NULL,
ADD CONSTRAINT "Negotiation_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "NegotiationOffer" DROP CONSTRAINT "NegotiationOffer_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "negotiationId",
ADD COLUMN     "negotiationId" INTEGER NOT NULL,
ADD CONSTRAINT "NegotiationOffer_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "OtpCode" DROP CONSTRAINT "OtpCode_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "rideId",
ADD COLUMN     "rideId" INTEGER NOT NULL,
DROP COLUMN "passengerId",
ADD COLUMN     "passengerId" INTEGER,
ADD CONSTRAINT "Payment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Review" DROP CONSTRAINT "Review_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "rideId",
ADD COLUMN     "rideId" INTEGER NOT NULL,
DROP COLUMN "driverId",
ADD COLUMN     "driverId" INTEGER NOT NULL,
ADD CONSTRAINT "Review_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Ride" DROP CONSTRAINT "Ride_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "driverId",
ADD COLUMN     "driverId" INTEGER,
ADD CONSTRAINT "Ride_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "RidePassenger" DROP CONSTRAINT "RidePassenger_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "rideId",
ADD COLUMN     "rideId" INTEGER NOT NULL,
DROP COLUMN "paymentId",
ADD COLUMN     "paymentId" INTEGER,
ADD CONSTRAINT "RidePassenger_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Negotiation_rideId_key" ON "Negotiation"("rideId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_rideId_key" ON "Payment"("rideId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_passengerId_key" ON "Payment"("passengerId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_rideId_key" ON "Review"("rideId");

-- CreateIndex
CREATE UNIQUE INDEX "RidePassenger_paymentId_key" ON "RidePassenger"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "RidePassenger_rideId_clientId_key" ON "RidePassenger"("rideId", "clientId");

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RidePassenger" ADD CONSTRAINT "RidePassenger_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RidePassenger" ADD CONSTRAINT "RidePassenger_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negotiation" ADD CONSTRAINT "Negotiation_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NegotiationOffer" ADD CONSTRAINT "NegotiationOffer_negotiationId_fkey" FOREIGN KEY ("negotiationId") REFERENCES "Negotiation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
