import { profileRepository } from "./profile.repository"
import { ConflictError, ForbiddenError } from "@/server/core/http/http-errors"

export async function assertEmailUnique(email: string, userId: number) {
    const existing = await profileRepository.findByEmail(email)

    if (existing && existing.id !== userId) {
        throw new ConflictError("Email already in use")
    }
}

export async function assertPhoneUnique(phone: string, userId: number) {
    const existing = await profileRepository.findByPhone(phone)

    if (existing && existing.id !== userId) {
        throw new ConflictError("Phone already in use")
    }
}

export async function assertDriverRole(role: string) {
    if (role !== "DRIVER") {
        throw new ForbiddenError("Only drivers allowed")
    }
}

export async function assertClientExists(userId: number) {
    const user = await profileRepository.findClientProfile(userId)
    if (!user) throw new Error("Client not found")
}