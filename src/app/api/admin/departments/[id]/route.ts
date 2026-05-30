import { handleApiError } from "@/server/core/http/error-handler";
import { verifyToken } from "@/server/lib/auth/auth";
import {
  deleteDepartmentService,
  getDepartmentByIdService,
  updateDepartmentService,
} from "@/server/modules/departments/departments.service";
import { updateDepartmentSchema } from "@/server/modules/departments/departments.schema";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyToken(req);
    const { id } = await params;
    const deptId = parseInt(id, 10);
    if (isNaN(deptId)) return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });

    const result = await getDepartmentByIdService(payload, deptId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyToken(req);
    const { id } = await params;
    const deptId = parseInt(id, 10);
    if (isNaN(deptId)) return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });

    const body = await req.json();
    const data = updateDepartmentSchema.parse(body);
    const result = await updateDepartmentService(payload, deptId, data);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyToken(req);
    const { id } = await params;
    const deptId = parseInt(id, 10);
    if (isNaN(deptId)) return NextResponse.json({ error: "Invalid department ID" }, { status: 400 });

    const result = await deleteDepartmentService(payload, deptId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
