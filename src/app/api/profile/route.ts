// app/api/profile/route.ts

import { unauthorized, verifyToken } from "@/services/auth/auth";
import { getProfileService, updateProfileService } from "@/services/profile/profile.service";
import { NextRequest } from "next/server";

// export async function GET(req: NextRequest) {
//     const payload = await verifyToken(req);
//     if (!payload) return unauthorized();

//     const user = await getProfileService(payload);

//     if (!user) return unauthorized();

//     return Response.json({ user });
// }
export async function GET(req: NextRequest) {
    const payload = await verifyToken(req);

    if (!payload) {
        return Response.json(
            { message: "Unauthenticated" },
            { status: 401 }
        );
    }

    const user = await getProfileService(payload);

    if (!user) {
        return Response.json(
            { message: "User not found" },
            { status: 404 }
        );
    }

    return Response.json({ user });
}
export async function PATCH(req: NextRequest) {
    const payload = await verifyToken(req);
    if (!payload) return unauthorized();

    const body = await req.json();

    const result = await updateProfileService(payload, body);

    return Response.json(result);
}