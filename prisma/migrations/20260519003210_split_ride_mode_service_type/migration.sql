-- CreateEnum
CREATE TYPE "RideFlow" AS ENUM ('NORMAL', 'NEGOTIATION');

-- AlterTable
ALTER TABLE "Ride" ADD COLUMN     "rideFlow" "RideFlow" NOT NULL DEFAULT 'NORMAL';
