import { prisma } from "@/lib/prisma";
import {
  CreateDepartmentDTO,
  GetDepartmentsQueryDTO,
  UpdateDepartmentDTO,
} from "./departments.schema";

export async function getDepartments(query: GetDepartmentsQueryDTO) {
  const skip = (query.page - 1) * query.limit;

  const where: any = {};

  if (query.isActive !== "all") {
    where.isActive = query.isActive === "active";
  }

  if (query.search) {
    where.name = { contains: query.search, mode: "insensitive" };
  }

  const [departments, total] = await Promise.all([
    prisma.department.findMany({
      where,
      skip,
      take: query.limit,
      orderBy: { order: "asc" },
    }),
    prisma.department.count({ where }),
  ]);

  return { departments, total };
}

export async function getDepartmentById(id: number) {
  return prisma.department.findUnique({ where: { id } });
}

export async function findByName(name: string) {
  return prisma.department.findUnique({ where: { name } });
}

export async function createDepartment(data: CreateDepartmentDTO) {
  return prisma.department.create({ data });
}

export async function updateDepartment(id: number, data: UpdateDepartmentDTO) {
  return prisma.department.update({ where: { id }, data });
}

export async function deleteDepartment(id: number) {
  return prisma.department.delete({ where: { id } });
}

export const departmentRepository = {
  getDepartments,
  getDepartmentById,
  findByName,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
