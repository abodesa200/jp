/**
 * Ride Repository
 * Database access layer for rides
 */

import { prisma } from "../../db/prisma";
import { GetRidesQuery } from "./ride.types";

export class RideRepository {
    /**
     * Create a new ride
     */
    async create(data: {
        clientId: number;
        pickupLat: number;
        pickupLng: number;
        pickupAddress: string;
        dropoffLat: number;
        dropoffLng: number;
        dropoffAddress: string;
        type: "STANDARD" | "CARPOOLING";
        maxPassengers: number;
        availableSeats: number;
        systemFare: number;
        distance: number;
        duration: number;
        status: string;
    }) {
        return prisma.ride.create({ data });
    }

    /**
     * Find ride by ID
     */
    async findById(id: number, include?: any) {
        return prisma.ride.findUnique({
            where: { id },
            include,
        });
    }

    /**
     * Find rides by client ID
     */
    async findByClientId(clientId: number, query: GetRidesQuery) {
        const { status, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const where: any = { clientId };
        if (status) {
            where.status = status;
        }

        const [rides, total] = await Promise.all([
            prisma.ride.findMany({
                where,
                skip,
                take: limit,
                orderBy: { requestedAt: "desc" },
                include: {
                    driver: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        },
                    },
                },
            }),
            prisma.ride.count({ where }),
        ]);

        return { rides, total, page, limit };
    }

    /**
     * Find rides by driver ID
     */
    async findByDriverId(driverId: number, query: GetRidesQuery) {
        const { status, page = 1, limit = 10 } = query;
        const skip = (page - 1) * limit;

        const where: any = { driverId };
        if (status) {
            where.status = status;
        }

        const [rides, total] = await Promise.all([
            prisma.ride.findMany({
                where,
                skip,
                take: limit,
                orderBy: { requestedAt: "desc" },
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        },
                    },
                },
            }),
            prisma.ride.count({ where }),
        ]);

        return { rides, total, page, limit };
    }

    /**
     * Update ride
     */
    async update(id: number, data: any) {
        return prisma.ride.update({
            where: { id },
            data,
        });
    }

    /**
     * Find nearby rides for drivers
     */
    async findNearby(lat: number, lng: number, radiusKm: number = 10) {
        // Simple implementation - in production use PostGIS or similar
        return prisma.ride.findMany({
            where: {
                status: "REQUESTED",
            },
            orderBy: {
                requestedAt: "desc",
            },
            take: 20,
        });
    }
}

export const rideRepository = new RideRepository();
