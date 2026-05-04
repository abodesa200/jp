/**
 * Ride Service (Main Facade)
 * Delegates to specialized sub-services
 */

import * as createService from "./services/ride-create.service";
import * as negotiationService from "./services/ride-negotiation.service";
import * as queryService from "./services/ride-query.service";
import * as statusService from "./services/ride-status.service";

export class RideService {
    // Ride Creation
    createRide = createService.createRide;

    // Ride Queries
    getUserRides = queryService.getUserRides;
    getRideById = queryService.getRideById;

    // Ride Status
    acceptRide = statusService.acceptRide;
    cancelRide = statusService.cancelRide;

    // Ride Negotiation
    negotiateRide = negotiationService.negotiateRide;
    respondToNegotiation = negotiationService.respondToNegotiation;
}

export const rideService = new RideService();
