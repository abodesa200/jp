import { ForbiddenError, NotFoundError } from "@/core/http/http-errors";
import { prisma } from "@/lib/prisma";
import { AddFavoriteDTO } from "./favorites.schema";

type Payload = {
    userId: number;
    role: string;
};

const MAX_FAVORITES = 20;

// ─────────────────────────────────────────────
// Get Favorite Locations
// ─────────────────────────────────────────────

export async function getFavoritesService(payload: Payload) {
    const favorites = await prisma.favoriteLocation.findMany({
        where: { userId: payload.userId },
        orderBy: { createdAt: "desc" },
    });

    return {
        favorites,
        total: favorites.length,
    };
}

// ─────────────────────────────────────────────
// Add Favorite Location
// ─────────────────────────────────────────────

export async function addFavoriteService(payload: Payload, data: AddFavoriteDTO) {
    // Check limit
    const count = await prisma.favoriteLocation.count({
        where: { userId: payload.userId },
    });

    if (count >= MAX_FAVORITES) {
        throw new ForbiddenError(`Maximum of ${MAX_FAVORITES} favorite locations allowed`);
    }

    const favorite = await prisma.favoriteLocation.create({
        data: {
            userId: payload.userId,
            name: data.name,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
        },
    });

    return favorite;
}

// ─────────────────────────────────────────────
// Delete Favorite Location
// ─────────────────────────────────────────────

export async function deleteFavoriteService(payload: Payload, favoriteId: number) {
    const favorite = await prisma.favoriteLocation.findUnique({
        where: { id: favoriteId },
    });

    if (!favorite) {
        throw new NotFoundError("Favorite location not found");
    }

    if (favorite.userId !== payload.userId) {
        throw new ForbiddenError("You can only delete your own favorite locations");
    }

    await prisma.favoriteLocation.delete({
        where: { id: favoriteId },
    });

    return { success: true, message: "Favorite location deleted" };
}
