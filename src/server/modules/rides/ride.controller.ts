/**
 * Ride Controller
 * HTTP request handlers for ride endpoints
 */

import { NextRequest } from "next/server";
import { handleApiError } from "../../core/error-handler";
import { successResponse } from "../../core/response";
import { authenticate } from "../../lib/auth";
import {
    createRideSchema,
    getRidesQuerySchema,
    negotiateRideSchema,
    respondToNegotiationSchema,
} from "./ride.schema";
import { rideService } from "./ride.service";

export class RideController {
    /**
     * POST /api/rides - Create new ride
     */
    async createRide(req: NextRequest) {
        try {
            const payload = await authenticate(req);
            const body = await req.json();
            const data = createRideSchema.parse(body);

            const result = await rideService.createRide(payload.userId, payload.role, data);

            return Response.json(successResponse(result));
        } catch (error) {
            return handleApiError(error);
        }
    }

    /**
     * GET /api/rides - Get user rides
     */
    async getUserRides(req: NextRequest) {
        try {
            const payload = await authenticate(req);
            const { searchParams } = new URL(req.url);

            const query = getRidesQuerySchema.parse({
                status: searchParams.get("status") || undefined,
                page: searchParams.get("page") || undefined,
                limit: searchParams.get("limit") || undefined,
            });

            const result = await rideService.getUserRides(payload.userId, payload.role, query);

            return Response.json(successResponse(result.rides, result.pagination));
        } catch (error) {
            return handleApiError(error);
        }
    }

    /**
     * GET /api/rides/:id - Get ride details
     */
    async getRideById(req: NextRequest, rideId: string) {
        try {
            const payload = await authenticate(req);
            const result = await rideService.getRideById(
                Number(rideId),
                payload.userId,
                payload.role
            );

            return Response.json(successResponse(result));
        } catch (error) {
            return handleApiError(error);
        }
    }

    /**
     * POST /api/rides/:id/accept - Accept ride
     */
    async acceptRide(req: NextRequest, rideId: string) {
        try {
            const payload = await authenticate(req);
            const result = await rideService.acceptRide(
                Number(rideId),
                payload.userId,
                payload.role
            );

            return Response.json(successResponse(result));
        } catch (error) {
            return handleApiError(error);
        }
    }

    /**
     * POST /api/rides/:id/cancel - Cancel ride
     */
    async cancelRide(req: NextRequest, rideId: string) {
        try {
            const payload = await authenticate(req);
            const result = await rideService.cancelRide(
                Number(rideId),
                payload.userId,
                payload.role
            );

            return Response.json(successResponse(result));
        } catch (error) {
            return handleApiError(error);
        }
    }

    /**
     * POST /api/rides/:id/negotiate - Negotiate ride fare
     */
    async negotiateRide(req: NextRequest, rideId: string) {
        try {
            const payload = await authenticate(req);
            const body = await req.json();
            const data = negotiateRideSchema.parse(body);

            const result = await rideService.negotiateRide(
                Number(rideId),
                payload.userId,
                payload.role,
                data
            );

            return Response.json(successResponse(result));
        } catch (error) {
            return handleApiError(error);
        }
    }

    /**
     * POST /api/rides/:id/negotiate/respond - Respond to negotiation
     */
    async respondToNegotiation(req: NextRequest, rideId: string) {
        try {
            const payload = await authenticate(req);
            const body = await req.json();
            const data = respondToNegotiationSchema.parse(body);

            const result = await rideService.respondToNegotiation(
                Number(rideId),
                payload.userId,
                payload.role,
                data
            );

            return Response.json(successResponse(result));
        } catch (error) {
            return handleApiError(error);
        }
    }
}

export const rideController = new RideController();
