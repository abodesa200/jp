import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
  createDepartmentService,
  getDepartmentsService,
} from "@/server/modules/departments/departments.service";
import {
  createDepartmentSchema,
  getDepartmentsQuerySchema,
} from "@/server/modules/departments/departments.schema";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const payload = await verifyToken(req);
    const { searchParams } = new URL(req.url);
    const query = getDepartmentsQuerySchema.parse({
      isActive: searchParams.get("isActive") || "all",
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      search: searchParams.get("search") || undefined,
    });

    const result = await getDepartmentsService(payload, query);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await verifyToken(req);
    const body = await req.json();
    const data = createDepartmentSchema.parse(body);
    const result = await createDepartmentService(payload, data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
