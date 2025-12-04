"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

const divisionSchema = z.object({
  nameLocal: z.string().min(1, "Division name (Thai) is required"),
  descriptionLocal: z.string().optional(),
});

type DivisionInput = z.infer<typeof divisionSchema>;

export async function getDivisions() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const divisions = await prisma.division.findMany({
      include: {
        _count: {
          select: {
            users: true,
            budgets: true,
            expenses: true,
          },
        },
      },
      orderBy: {
        nameLocal: "asc",
      },
    });

    return { success: true, data: divisions };
  } catch (error) {
    console.error("Get divisions error:", error);
    return { success: false, error: "Failed to fetch divisions" };
  }
}

export async function getDivisionById(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const division = await prisma.division.findUnique({
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

    if (!division) {
      return { success: false, error: "Division not found" };
    }

    return { success: true, data: division };
  } catch (error) {
    console.error("Get division error:", error);
    return { success: false, error: "Failed to fetch division" };
  }
}

export async function createDivision(data: DivisionInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only SUPER_ADMIN and ADMIN can create divisions
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN
    ) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    const validatedData = divisionSchema.parse(data);

    const division = await prisma.division.create({
      data: {
        nameLocal: validatedData.nameLocal,
        descriptionLocal: validatedData.descriptionLocal || null,
      },
    });

    revalidatePath("/dashboard/divisions");
    return { success: true, data: division };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation error",
      };
    }
    console.error("Create division error:", error);
    return { success: false, error: "Failed to create division" };
  }
}

export async function updateDivision(id: string, data: DivisionInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only SUPER_ADMIN and ADMIN can update divisions
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN
    ) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    const validatedData = divisionSchema.parse(data);

    // Check if division exists
    const existingDivision = await prisma.division.findUnique({
      where: { id },
    });

    if (!existingDivision) {
      return { success: false, error: "Division not found" };
    }

    const division = await prisma.division.update({
      where: { id },
      data: {
        nameLocal: validatedData.nameLocal,
        descriptionLocal: validatedData.descriptionLocal || null,
      },
    });

    revalidatePath("/dashboard/divisions");
    revalidatePath(`/dashboard/divisions/${id}`);
    return { success: true, data: division };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation error",
      };
    }
    console.error("Update division error:", error);
    return { success: false, error: "Failed to update division" };
  }
}

export async function deleteDivision(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only SUPER_ADMIN can delete divisions
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return { success: false, error: "Only Super Admin can delete divisions" };
    }

    // Check if division exists
    const division = await prisma.division.findUnique({
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

    if (!division) {
      return { success: false, error: "Division not found" };
    }

    // Prevent deletion if division has users, budgets, or expenses
    if (division._count.users > 0) {
      return { success: false, error: "Cannot delete division with users" };
    }

    if (division._count.budgets > 0) {
      return { success: false, error: "Cannot delete division with budgets" };
    }

    if (division._count.expenses > 0) {
      return { success: false, error: "Cannot delete division with expenses" };
    }

    await prisma.division.delete({
      where: { id },
    });

    revalidatePath("/dashboard/divisions");
    return { success: true };
  } catch (error) {
    console.error("Delete division error:", error);
    return { success: false, error: "Failed to delete division" };
  }
}

export async function getDivisionStatistics(divisionId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const division = await prisma.division.findUnique({
      where: { id: divisionId },
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

    if (!division) {
      return { success: false, error: "Division not found" };
    }

    // Calculate statistics
    const totalAllocated = division.budgets.reduce(
      (sum, budget) => sum + Number(budget.allocatedAmount),
      0
    );

    const totalSpent = division.budgets.reduce(
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
      divisionName: division.nameLocal || "Unknown Division",
      totalUsers: division._count.users,
      totalBudgets: division._count.budgets,
      totalExpenses: division._count.expenses,
      totalAllocated,
      totalSpent,
      remaining: totalAllocated - totalSpent,
      utilizationRate:
        totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0,
    };

    return { success: true, data: statistics };
  } catch (error) {
    console.error("Get division statistics error:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}
