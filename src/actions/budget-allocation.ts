"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";

const budgetAllocationSchema = z.object({
  nameLocal: z.string().min(1, "Thai name is required"),
  descriptionLocal: z.string().optional(),
  budgetId: z.string().min(1, "Budget is required"),
  allocatedAmount: z.number().positive("Amount must be positive"),
  startDate: z.date(),
  endDate: z.date(),
});

type BudgetAllocationInput = z.infer<typeof budgetAllocationSchema>;

// Get all budget allocations with filters
export async function getBudgetAllocations(filters?: {
  budgetId?: string;
  status?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const where: any = {};

    if (filters?.budgetId) {
      where.budgetId = filters.budgetId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const allocations = await prisma.budgetAllocation.findMany({
      where,
      include: {
        budget: {
          include: {
            division: true,
            output: true,
            category: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        expenses: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate spent and remaining amounts for each allocation
    const allocationsWithCalculations = allocations.map((allocation) => {
      const spentAmount = allocation.expenses
        .filter(
          (exp) => exp.status !== "REJECTED" && exp.status !== "CANCELLED"
        )
        .reduce((sum, exp) => sum + Number(exp.amount), 0);

      return {
        ...allocation,
        allocatedAmount: Number(allocation.allocatedAmount),
        spentAmount,
        remainingAmount: Number(allocation.allocatedAmount) - spentAmount,
      };
    });

    return { success: true, data: allocationsWithCalculations };
  } catch (error) {
    console.error("Error fetching budget allocations:", error);
    return { success: false, error: "Failed to fetch budget allocations" };
  }
}

// Get single budget allocation by ID
export async function getBudgetAllocationById(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const allocation = await prisma.budgetAllocation.findUnique({
      where: { id },
      include: {
        budget: {
          include: {
            division: true,
            category: true,
            plan: true,
            output: true,
            activity: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        expenses: {
          include: {
            category: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!allocation) {
      return { success: false, error: "Budget allocation not found" };
    }

    return {
      success: true,
      data: {
        ...allocation,
        allocatedAmount: Number(allocation.allocatedAmount),
        expenses: allocation.expenses.map((exp) => ({
          ...exp,
          amount: Number(exp.amount),
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching budget allocation:", error);
    return { success: false, error: "Failed to fetch budget allocation" };
  }
}

// Create new budget allocation (subtracts from parent budget)
export async function createBudgetAllocation(data: BudgetAllocationInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Validate permissions
    if (session.user.role === UserRole.VIEWER) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    const validatedData = budgetAllocationSchema.parse(data);

    // Get parent budget and check available amount
    const budget = await prisma.budget.findUnique({
      where: { id: validatedData.budgetId },
      include: {
        budgetAllocations: {
          select: {
            allocatedAmount: true,
            status: true,
          },
        },
      },
    });

    if (!budget) {
      return { success: false, error: "Budget not found" };
    }

    // Calculate total allocated from this budget
    const totalAllocated = budget.budgetAllocations
      .filter((alloc) => alloc.status === "ACTIVE")
      .reduce((sum, alloc) => sum + Number(alloc.allocatedAmount), 0);

    const availableAmount = Number(budget.allocatedAmount) - totalAllocated;

    // Check if requested amount exceeds available budget
    if (validatedData.allocatedAmount > availableAmount) {
      return {
        success: false,
        error: `Insufficient budget. Available: ${availableAmount.toLocaleString()} THB`,
      };
    }

    // Generate code
    const timestamp = Date.now().toString(36).toUpperCase();
    const code = `ALLOC-${budget.fiscalYear}-${timestamp}`;

    // Create budget allocation
    const allocation = await prisma.budgetAllocation.create({
      data: {
        code,
        name: validatedData.nameLocal, // Use Thai name as the main name
        nameLocal: validatedData.nameLocal,
        description: validatedData.descriptionLocal,
        descriptionLocal: validatedData.descriptionLocal,
        budgetId: validatedData.budgetId,
        allocatedAmount: validatedData.allocatedAmount,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        createdById: session.user.id,
      },
      include: {
        budget: {
          include: {
            division: true,
          },
        },
      },
    });

    revalidatePath("/[locale]/dashboard/projects");
    revalidatePath(`/[locale]/dashboard/budgets/${validatedData.budgetId}`);

    return {
      success: true,
      data: {
        ...allocation,
        allocatedAmount: Number(allocation.allocatedAmount),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation error",
      };
    }
    console.error("Create budget allocation error:", error);
    return { success: false, error: "Failed to create budget allocation" };
  }
}

// Update budget allocation
export async function updateBudgetAllocation(
  id: string,
  data: Partial<BudgetAllocationInput>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const existing = await prisma.budgetAllocation.findUnique({
      where: { id },
      include: {
        budget: {
          include: {
            budgetAllocations: {
              select: {
                id: true,
                allocatedAmount: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return { success: false, error: "Budget allocation not found" };
    }

    // Check permissions
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN &&
      existing.createdById !== session.user.id
    ) {
      return { success: false, error: "Access denied" };
    }

    // If changing allocated amount, check availability
    if (
      data.allocatedAmount &&
      data.allocatedAmount !== Number(existing.allocatedAmount)
    ) {
      const totalAllocated = existing.budget.budgetAllocations
        .filter((alloc) => alloc.status === "ACTIVE" && alloc.id !== id)
        .reduce((sum, alloc) => sum + Number(alloc.allocatedAmount), 0);

      const availableAmount =
        Number(existing.budget.allocatedAmount) - totalAllocated;

      if (data.allocatedAmount > availableAmount) {
        return {
          success: false,
          error: `Insufficient budget. Available: ${availableAmount.toLocaleString()} THB`,
        };
      }
    }

    const allocation = await prisma.budgetAllocation.update({
      where: { id },
      data: {
        name: data.nameLocal || existing.nameLocal, // Use Thai name as the main name
        nameLocal: data.nameLocal,
        description: data.descriptionLocal || null,
        descriptionLocal: data.descriptionLocal || null,
        allocatedAmount: data.allocatedAmount,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      include: {
        budget: {
          include: {
            division: true,
          },
        },
      },
    });

    revalidatePath("/[locale]/dashboard/projects");
    revalidatePath(`/[locale]/dashboard/projects/${id}`);
    revalidatePath(`/[locale]/dashboard/budgets/${existing.budgetId}`);

    return {
      success: true,
      data: {
        ...allocation,
        allocatedAmount: Number(allocation.allocatedAmount),
      },
    };
  } catch (error) {
    console.error("Update budget allocation error:", error);
    return { success: false, error: "Failed to update budget allocation" };
  }
}

// Delete budget allocation
export async function deleteBudgetAllocation(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const existing = await prisma.budgetAllocation.findUnique({
      where: { id },
      include: {
        expenses: true,
      },
    });

    if (!existing) {
      return { success: false, error: "Budget allocation not found" };
    }

    // Only admins can delete
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN
    ) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Can't delete if has expenses
    if (existing.expenses.length > 0) {
      return {
        success: false,
        error: "Cannot delete budget allocation with existing expenses",
      };
    }

    await prisma.budgetAllocation.delete({
      where: { id },
    });

    revalidatePath("/[locale]/dashboard/projects");
    revalidatePath(`/[locale]/dashboard/budgets/${existing.budgetId}`);

    return { success: true };
  } catch (error) {
    console.error("Delete budget allocation error:", error);
    return { success: false, error: "Failed to delete budget allocation" };
  }
}
