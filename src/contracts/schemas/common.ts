/**
 * Common Schemas - مشتركة بين كل الـ contracts
 */
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// تفعيل OpenAPI extensions على Zod
extendZodWithOpenApi(z);

// ─────────────────────────────────────────────
// Error Schemas
// ─────────────────────────────────────────────

export const errorSchema = z.object({
    error: z.string(),
}).openapi('Error');

// ─────────────────────────────────────────────
// User Schemas
// ─────────────────────────────────────────────

export const userRoleSchema = z.enum(['CLIENT', 'DRIVER', 'ADMIN', 'CUSTOMER_SUPPORT']);

export const userSchema = z.object({
    id: z.number().openapi({ example: 1 }),
    phone: z.string().nullable().openapi({ example: '+966501234567' }),
    email: z.string().email().nullable().openapi({ example: 'user@example.com' }),
    name: z.string().nullable().openapi({ example: 'Ahmed Mohammed' }),
    avatarUrl: z.string().nullable().openapi({ example: 'https://example.com/avatar.jpg' }),
    role: userRoleSchema.openapi({ example: 'CLIENT' }),
    isVerified: z.boolean().openapi({ example: true }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
}).openapi('User');

// ─────────────────────────────────────────────
// Driver Schemas
// ─────────────────────────────────────────────

export const driverSchema = z.object({
    id: z.number().openapi({ example: 1 }),
    userId: z.number().openapi({ example: 5 }),
    licenseNumber: z.string().openapi({ example: '123456789' }),
    carModel: z.string().openapi({ example: 'Toyota Camry 2022' }),
    carPlate: z.string().openapi({ example: 'ABC-1234' }),
    carColor: z.string().nullable().openapi({ example: 'White' }),
    carYear: z.number().nullable().openapi({ example: 2022 }),
    isApproved: z.boolean().openapi({ example: true }),
    isOnline: z.boolean().openapi({ example: false }),
    latitude: z.number().nullable().openapi({ example: 24.7136 }),
    longitude: z.number().nullable().openapi({ example: 46.6753 }),
    lastLocationUpdate: z.string().datetime().nullable().openapi({ example: '2026-05-03T14:12:53.000Z' }),
    rating: z.number().openapi({ example: 4.5 }),
    totalRides: z.number().openapi({ example: 150 }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
}).openapi('Driver');

// ─────────────────────────────────────────────
// Ride Schemas
// ─────────────────────────────────────────────

export const rideStatusSchema = z.enum([
    'REQUESTED',
    'ACCEPTED',
    'DRIVER_ARRIVED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
]);

export const rideTypeSchema = z.enum(['STANDARD', 'CARPOOLING']);

export const rideSchema = z.object({
    id: z.number().openapi({ example: 1 }),
    clientId: z.number().openapi({ example: 10 }),
    driverId: z.number().nullable().openapi({ example: 5 }),
    status: rideStatusSchema.openapi({ example: 'REQUESTED' }),
    type: rideTypeSchema.openapi({ example: 'STANDARD' }),
    maxPassengers: z.number().openapi({ example: 1 }),
    availableSeats: z.number().openapi({ example: 1 }),
    systemFare: z.number().nullable().openapi({ example: 35.50 }),
    pickupLat: z.number().openapi({ example: 24.7136 }),
    pickupLng: z.number().openapi({ example: 46.6753 }),
    pickupAddress: z.string().nullable().openapi({ example: 'King Fahd Road, Riyadh' }),
    dropoffLat: z.number().openapi({ example: 24.7736 }),
    dropoffLng: z.number().openapi({ example: 46.7353 }),
    dropoffAddress: z.string().nullable().openapi({ example: 'King Khalid International Airport' }),
    fare: z.number().nullable().openapi({ example: 30.00 }),
    distance: z.number().nullable().openapi({ example: 15.5 }),
    duration: z.number().nullable().openapi({ example: 1200 }),
    requestedAt: z.string().datetime(),
    acceptedAt: z.string().datetime().nullable(),
    startedAt: z.string().datetime().nullable(),
    completedAt: z.string().datetime().nullable(),
    cancelledAt: z.string().datetime().nullable(),
    cancelReason: z.string().nullable().openapi({ example: 'Emergency situation' }),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
}).openapi('Ride');

// ─────────────────────────────────────────────
// Pagination Schemas
// ─────────────────────────────────────────────

export const paginationQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1).openapi({ example: 1 }),
    limit: z.coerce.number().min(1).max(100).default(20).openapi({ example: 20 }),
});

export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
    });
