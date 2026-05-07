import { ForbiddenError, NotFoundError } from "@/server/core/http/http-errors";
import { favoritesRepository } from "./favorites.repository";
import { AddFavoriteDTO } from "./favorites.schema";

type JWTPayload = {
    userId: number;
    role: "CLIENT" | "DRIVER" | "ADMIN" | "CUSTOMER_SUPPORT";
};

const MAX_FAVORITES = 20;

// ─────────────────────────────────────────────
// Get Favorite Locations
// ─────────────────────────────────────────────

export async function getFavoritesService(payload: JWTPayload) {
    const favorites = await favoritesRepository.findAllByUser(payload.userId);

    return {
        favorites,
        total: favorites.length,
    };
}

// ─────────────────────────────────────────────
// Add Favorite Location
// ─────────────────────────────────────────────

export async function addFavoriteService(
    payload: JWTPayload,
    data: AddFavoriteDTO
) {
    // Check limit
    const count = await favoritesRepository.countByUser(payload.userId);

    if (count >= MAX_FAVORITES) {
        throw new ForbiddenError(
            `Maximum of ${MAX_FAVORITES} favorite locations allowed`
        );
    }

    const favorite = await favoritesRepository.create({
        userId: payload.userId,
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
    });

    return favorite;
}

// ─────────────────────────────────────────────
// Delete Favorite Location
// ─────────────────────────────────────────────

export async function deleteFavoriteService(
    payload: JWTPayload,
    favoriteId: number
) {
    const favorite = await favoritesRepository.findById(favoriteId);

    if (!favorite) {
        throw new NotFoundError("Favorite location not found");
    }

    if (favorite.userId !== payload.userId) {
        throw new ForbiddenError("You can only delete your own favorite locations");
    }

    await favoritesRepository.delete(favoriteId);

    return { success: true, message: "Favorite location deleted" };
}
