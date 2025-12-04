"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

const departmentSchema = z.object({
  code: z.string().min(1, "Department code is required"),
  name: z.string().min(1, "Department name is required"),
  nameLocal: z.string().optional(),
  description: z.string().optional(),
  descriptionLocal: z.string().optional(),
});

type DepartmentInput = z.infer<typeof departmentSchema>;

export async function getDepartments() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const departments = await prisma.division.findMany({
      include: {
        _count: {
          select: {
            users: true,
            budgets: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, data: departments };
  } catch (error) {
    console.error("Get departments error:", error);
    return { success: false, error: "Failed to fetch departments" };
  }
}

export async function getDepartmentById(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const department = await prisma.division.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            division: true,
          },
        },
        budgets: {
          include: {
            category: true,
            createdBy: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        _count: {
          select: {
            users: true,
            budgets: true,
            expenses: true,
          },
        },
      },
    });

    if (!department) {
      return { success: false, error: "Department not found" };
    }

    return { success: true, data: department };
  } catch (error) {
    console.error("Get department error:", error);
    return { success: false, error: "Failed to fetch department" };
  }
}

export async function createDepartment(data: DepartmentInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only SUPER_ADMIN and ADMIN can create departments
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.ADMIN) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    const validatedData = departmentSchema.parse(data);

    // Check if department code already exists
    const existingDepartment = await prisma.division.findUnique({
      where: { code: validatedData.code },
    });

    if (existingDepartment) {
      return { success: false, error: "Department code already exists" };
    }


    const department = await prisma.division.create({
      data: {
        code: validatedData.code,
        name: validatedData.name,
        nameLocal: validatedData.nameLocal || null,
        description: validatedData.description || null,
        descriptionLocal: validatedData.descriptionLocal || null,
      },
    });

    revalidatePath("/dashboard/departments");
    return { success: true, data: department };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Create department error:", error);
    return { success: false, error: "Failed to create department" };
  }
}

export async function updateDepartment(id: string, data: DepartmentInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only SUPER_ADMIN and ADMIN can update departments
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.ADMIN) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    const validatedData = departmentSchema.parse(data);

    // Check if department exists
    const existingDepartment = await prisma.division.findUnique({
      where: { id },
    });

    if (!existingDepartment) {
      return { success: false, error: "Department not found" };
    }

    // Check if code is being changed and if it already exists
    if (validatedData.code !== existingDepartment.code) {
      const duplicateCode = await prisma.division.findUnique({
        where: { code: validatedData.code },
      });

      if (duplicateCode) {
        return { success: false, error: "Department code already exists" };
      }
    }


    const department = await prisma.division.update({
      where: { id },
      data: {
        code: validatedData.code,
        name: validatedData.name,
        nameLocal: validatedData.nameLocal || null,
        description: validatedData.description || null,
        descriptionLocal: validatedData.descriptionLocal || null,
      },
    });

    revalidatePath("/dashboard/departments");
    revalidatePath(`/dashboard/departments/${id}`);
    return { success: true, data: department };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Update department error:", error);
    return { success: false, error: "Failed to update department" };
  }
}

export async function deleteDepartment(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only SUPER_ADMIN can delete departments
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return { success: false, error: "Only Super Admin can delete departments" };
    }

    // Check if department exists
    const department = await prisma.division.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            budgets: true,
            expenses: true,
          },
        },
      },
    });

    if (!department) {
      return { success: false, error: "Department not found" };
    }

    // Prevent deletion if department has users, budgets, expenses, or child departments
    if (department._count.users > 0) {
      return { success: false, error: "Cannot delete department with users" };
    }

    if (department._count.budgets > 0) {
      return { success: false, error: "Cannot delete department with budgets" };
    }

    if (department._count.expenses > 0) {
      return { success: false, error: "Cannot delete department with expenses" };
    }


    await prisma.division.delete({
      where: { id },
    });

    revalidatePath("/dashboard/departments");
    return { success: true };
  } catch (error) {
    console.error("Delete department error:", error);
    return { success: false, error: "Failed to delete department" };
  }
}

export async function getDepartmentStatistics(departmentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const department = await prisma.division.findUnique({
      where: { id: departmentId },
      include: {
        budgets: {
          include: {
            expenses: true,
          },
        },
        _count: {
          select: {
            users: true,
            budgets: true,
            expenses: true,
          },
        },
      },
    });

    if (!department) {
      return { success: false, error: "Department not found" };
    }

    // Calculate statistics
    const totalAllocated = department.budgets.reduce(
      (sum, budget) => sum + Number(budget.allocatedAmount),
      0
    );

    const totalSpent = department.budgets.reduce(
      (sum, budget) =>
        sum +
        budget.expenses.reduce(
          (expSum, expense) =>
            expense.status !== "REJECTED" && expense.status !== "CANCELLED"
              ? expSum + Number(expense.amount)
              : expSum,
          0
        ),
      0
    );

    const statistics = {
      departmentName: department.name,
      totalUsers: department._count.users,
      totalBudgets: department._count.budgets,
      totalExpenses: department._count.expenses,
      totalAllocated,
      totalSpent,
      remaining: totalAllocated - totalSpent,
      utilizationRate: totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0,
    };

    return { success: true, data: statistics };
  } catch (error) {
    console.error("Get department statistics error:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}
