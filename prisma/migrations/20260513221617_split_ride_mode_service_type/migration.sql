/*
  Warnings:

  - You are about to drop the column `type` on the `Ride` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RideMode" AS ENUM ('PRIVATE', 'CARPOOLING');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('STANDARD', 'VIP', 'VAN');

-- AlterTable
ALTER TABLE "Ride" DROP COLUMN "type",
ADD COLUMN     "rideMode" "RideMode" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "serviceType" "ServiceType" NOT NULL DEFAULT 'STANDARD';

-- DropEnum
DROP TYPE "RideType";
