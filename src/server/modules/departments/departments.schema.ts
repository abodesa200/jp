import { z } from "zod";

export const getDepartmentsQuerySchema = z.object({
  isActive: z.enum(["all", "active", "inactive"]).optional().default("all"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
});

export type GetDepartmentsQueryDTO = z.infer<typeof getDepartmentsQuerySchema>;

export const createDepartmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  isActive: z.boolean().optional().default(true),
  order: z.number().int().optional().default(0),
});

export type CreateDepartmentDTO = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

export type UpdateDepartmentDTO = z.infer<typeof updateDepartmentSchema>;
