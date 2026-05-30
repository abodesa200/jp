import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "@/server/core/http/http-errors";
import { departmentRepository } from "./departments.repository";
import {
  CreateDepartmentDTO,
  GetDepartmentsQueryDTO,
  UpdateDepartmentDTO,
} from "./departments.schema";

type JWTPayload = {
  userId: number;
  role: string;
};

export async function getDepartmentsService(
  payload: JWTPayload,
  query: GetDepartmentsQueryDTO
) {
  if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
    throw new ForbiddenError("Admin or support access required");
  }

  const { departments, total } = await departmentRepository.getDepartments(query);

  return {
    departments,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getDepartmentByIdService(
  payload: JWTPayload,
  id: number
) {
  if (payload.role !== "ADMIN" && payload.role !== "CUSTOMER_SUPPORT") {
    throw new ForbiddenError("Admin or support access required");
  }

  const department = await departmentRepository.getDepartmentById(id);
  if (!department) throw new NotFoundError("Department not found");

  return { department };
}

export async function createDepartmentService(
  payload: JWTPayload,
  data: CreateDepartmentDTO
) {
  if (payload.role !== "ADMIN") {
    throw new ForbiddenError("Admin access required");
  }

  const existing = await departmentRepository.findByName(data.name);
  if (existing) throw new ConflictError("Department name already exists");

  const department = await departmentRepository.createDepartment(data);
  return { department, message: "Department created successfully" };
}

export async function updateDepartmentService(
  payload: JWTPayload,
  id: number,
  data: UpdateDepartmentDTO
) {
  if (payload.role !== "ADMIN") {
    throw new ForbiddenError("Admin access required");
  }

  const department = await departmentRepository.getDepartmentById(id);
  if (!department) throw new NotFoundError("Department not found");

  if (data.name && data.name !== department.name) {
    const existing = await departmentRepository.findByName(data.name);
    if (existing) throw new ConflictError("Department name already exists");
  }

  const updated = await departmentRepository.updateDepartment(id, data);
  return { department: updated, message: "Department updated successfully" };
}

export async function deleteDepartmentService(
  payload: JWTPayload,
  id: number
) {
  if (payload.role !== "ADMIN") {
    throw new ForbiddenError("Admin access required");
  }

  const department = await departmentRepository.getDepartmentById(id);
  if (!department) throw new NotFoundError("Department not found");

  await departmentRepository.deleteDepartment(id);
  return { message: "Department deleted successfully" };
}
