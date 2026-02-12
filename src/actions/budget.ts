"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

// Validation schema for form input (simplified version 2)
const budgetFormSchema = z
  .object({
    fiscalYear: z.number().int().min(2543).max(2643), // Buddhist calendar years
    categoryId: z.string().min(1, "Category is required"),
    planId: z.string().optional(),
    outputId: z.string().optional(),
    activityId: z.string().optional(),
    allocatedAmount: z.number().positive("Amount must be positive"),
    // Custom name fields
    customPlanName: z.string().optional(),
    customOutputName: z.string().optional(),
    customActivityName: z.string().optional(),
  })
  .refine((data) => data.planId || data.customPlanName, {
    message: "Plan is required",
    path: ["planId"],
  })
  .refine((data) => data.outputId || data.customOutputName, {
    message: "Output is required",
    path: ["outputId"],
  })
  .refine((data) => data.activityId || data.customActivityName, {
    message: "Activity is required",
    path: ["activityId"],
  });

// Full schema for database operations
const budgetSchema = z.object({
  code: z.string().min(1, "Budget code is required"),
  name: z.string().min(1, "Budget name is required"),
  nameLocal: z.string().min(1, "Thai budget name is required"),
  description: z.string().optional(),
  descriptionLocal: z.string().optional(),
  fiscalYear: z.number().int().min(2543).max(2643), // Buddhist calendar years
  divisionId: z.string().min(1, "Division is required"),
  categoryId: z.string().min(1, "Category is required"),
  planId: z.string().min(1, "Plan is required"),
  outputId: z.string().min(1, "Output is required"),
  activityId: z.string().min(1, "Activity is required"),
  allocatedAmount: z.number().positive("Amount must be positive"),
  startDate: z.date(),
  endDate: z.date(),
});

type BudgetFormInput = z.infer<typeof budgetFormSchema>;
type BudgetInput = z.infer<typeof budgetSchema>;

// Get all budgets with filters
export async function getBudgets(filters?: {
  divisionId?: string;
  fiscalYear?: number;
  search?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const where: Record<string, unknown> = {};

    // Non-admins can only see their department's budgets
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN
    ) {
      where.divisionId = session.user.divisionId;
    } else if (filters?.divisionId) {
      where.divisionId = filters.divisionId;
    }

    if (filters?.fiscalYear) {
      where.fiscalYear = filters.fiscalYear;
    }

    if (filters?.search) {
      where.OR = [
        { code: { contains: filters.search, mode: "insensitive" } },
        { name: { contains: filters.search, mode: "insensitive" } },
        { nameLocal: { contains: filters.search } },
      ];
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        division: true,
        category: true,
        plan: true,
        output: true,
        activity: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        budgetAllocations: {
          select: {
            id: true,
            allocatedAmount: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate allocated and remaining amounts
    const budgetsWithCalculations = budgets.map((budget) => {
      const allocatedToProjects = budget.budgetAllocations
        .filter((alloc) => alloc.status === "ACTIVE")
        .reduce((sum, alloc) => sum + Number(alloc.allocatedAmount), 0);

      return {
        ...budget,
        allocatedAmount: Number(budget.allocatedAmount),
        spentAmount: allocatedToProjects,
        remainingAmount: Number(budget.allocatedAmount) - allocatedToProjects,
        budgetAllocations: budget.budgetAllocations.map((alloc) => ({
          ...alloc,
          allocatedAmount: Number(alloc.allocatedAmount),
        })),
      };
    });

    return { success: true, data: budgetsWithCalculations };
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return { success: false, error: "Failed to fetch budgets" };
  }
}

// Get single budget by ID
export async function getBudgetById(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const budget = await prisma.budget.findUnique({
      where: { id },
      include: {
        division: true,
        category: true,
        plan: true,
        output: true,
        activity: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        budgetAllocations: {
          select: {
            id: true,
            code: true,
            name: true,
            nameLocal: true,
            allocatedAmount: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            level: "asc",
          },
        },
      },
    });

    if (!budget) {
      return { success: false, error: "Budget not found" };
    }

    // Check access permissions
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN &&
      budget.divisionId !== session.user.divisionId
    ) {
      return { success: false, error: "Access denied" };
    }

    // Calculate allocated and remaining amounts
    const allocatedToProjects = budget.budgetAllocations
      .filter((alloc) => alloc.status === "ACTIVE")
      .reduce((sum, alloc) => sum + Number(alloc.allocatedAmount), 0);

    return {
      success: true,
      data: {
        ...budget,
        allocatedAmount: Number(budget.allocatedAmount),
        allocatedToProjects,
        remainingAmount: Number(budget.allocatedAmount) - allocatedToProjects,
        budgetAllocations: budget.budgetAllocations.map((alloc) => ({
          ...alloc,
          allocatedAmount: Number(alloc.allocatedAmount),
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching budget:", error);
    return { success: false, error: "Failed to fetch budget" };
  }
}

// Create new budget
export async function createBudget(data: BudgetFormInput) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.divisionId) {
      throw new Error("Unauthorized");
    }

    // Validate permissions
    if (session.user.role === UserRole.VIEWER) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate form input
    const formData = budgetFormSchema.parse(data);

    let planId = formData.planId;
    let outputId = formData.outputId;
    let activityId = formData.activityId;
    let planNameLocal = "";
    let activityNameLocal = "";

    // Create custom Plan if needed
    if (formData.customPlanName && !planId) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const newPlan = await prisma.plan.create({
        data: {
          code: `PLN-${timestamp}`,
          name: formData.customPlanName,
          nameLocal: formData.customPlanName,
        },
      });
      planId = newPlan.id;
      planNameLocal = newPlan.nameLocal;
    }

    // Create custom Output if needed
    if (formData.customOutputName && !outputId) {
      if (!planId) {
        return { success: false, error: "Plan is required to create Output" };
      }
      const timestamp = Date.now().toString(36).toUpperCase();
      const newOutput = await prisma.output.create({
        data: {
          code: `OUT-${timestamp}`,
          name: formData.customOutputName,
          nameLocal: formData.customOutputName,
          planId: planId,
        },
      });
      outputId = newOutput.id;
    }

    // Create custom Activity if needed
    if (formData.customActivityName && !activityId) {
      if (!outputId) {
        return {
          success: false,
          error: "Output is required to create Activity",
        };
      }
      const timestamp = Date.now().toString(36).toUpperCase();
      const newActivity = await prisma.activity.create({
        data: {
          code: `ACT-${timestamp}`,
          name: formData.customActivityName,
          nameLocal: formData.customActivityName,
          outputId: outputId,
        },
      });
      activityId = newActivity.id;
      activityNameLocal = newActivity.nameLocal;
    }

    // Fetch related data to generate names (for existing selections)
    const [plan, output, activity] = await Promise.all([
      planId ? prisma.plan.findUnique({ where: { id: planId } }) : null,
      outputId ? prisma.output.findUnique({ where: { id: outputId } }) : null,
      activityId
        ? prisma.activity.findUnique({ where: { id: activityId } })
        : null,
    ]);

    if (!plan || !output || !activity) {
      return { success: false, error: "Invalid plan, output, or activity" };
    }

    // Use fetched names if not already set
    if (!planNameLocal) planNameLocal = plan.nameLocal;
    if (!activityNameLocal) activityNameLocal = activity.nameLocal;

    // Generate auto-filled values
    const timestamp = Date.now().toString(36).toUpperCase();
    const code = `BUD-${formData.fiscalYear}-${timestamp}`;
    const name = `${planNameLocal} - ${activityNameLocal}`;
    const nameLocal = `${planNameLocal} - ${activityNameLocal}`;

    // Thai fiscal year: Oct 1 to Sep 30
    // Convert Buddhist year to Gregorian (subtract 543)
    const gregorianYear = formData.fiscalYear - 543;
    const startDate = new Date(gregorianYear - 1, 9, 1); // Oct 1 of previous year
    const endDate = new Date(gregorianYear, 8, 30); // Sep 30 of current year

    // Build full budget data
    const fullData: BudgetInput = {
      code,
      name,
      nameLocal,
      description: undefined,
      descriptionLocal: undefined,
      fiscalYear: formData.fiscalYear,
      divisionId: session.user.divisionId,
      categoryId: formData.categoryId,
      planId: planId!,
      outputId: outputId!,
      activityId: activityId!,
      allocatedAmount: formData.allocatedAmount,
      startDate,
      endDate,
    };

    // Validate full data
    const validated = budgetSchema.parse(fullData);

    // Check for duplicate code (should be unique due to timestamp)
    const existing = await prisma.budget.findUnique({
      where: { code: validated.code },
    });

    if (existing) {
      return { success: false, error: "Budget code already exists" };
    }

    const budget = await prisma.budget.create({
      data: {
        ...validated,
        createdById: session.user.id,
      },
      include: {
        division: true,
        category: true,
        plan: true,
        output: true,
        activity: true,
      },
    });

    revalidatePath("/[locale]/dashboard/budgets");
    return {
      success: true,
      data: {
        ...budget,
        allocatedAmount: Number(budget.allocatedAmount),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation error",
      };
    }
    console.error("Error creating budget:", error);
    return { success: false, error: "Failed to create budget" };
  }
}

// Update budget
export async function updateBudget(id: string, data: Partial<BudgetFormInput>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const existing = await prisma.budget.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Budget not found" };
    }

    // Check permissions
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN &&
      existing.createdById !== session.user.id
    ) {
      return { success: false, error: "Access denied" };
    }

    // Prepare update data
    const updateData: Partial<
      BudgetFormInput & { name?: string; nameLocal?: string }
    > = { ...data };

    // If plan or activity changed, regenerate name
    if (data.planId || data.activityId) {
      const planId = data.planId || existing.planId;
      const activityId = data.activityId || existing.activityId;

      const [plan, activity] = await Promise.all([
        prisma.plan.findUnique({ where: { id: planId } }),
        prisma.activity.findUnique({ where: { id: activityId } }),
      ]);

      if (plan && activity) {
        updateData.name = `${plan.nameLocal} - ${activity.nameLocal}`;
        updateData.nameLocal = `${plan.nameLocal} - ${activity.nameLocal}`;
      }
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        division: true,
        category: true,
        plan: true,
        output: true,
        activity: true,
      },
    });

    revalidatePath("/[locale]/dashboard/budgets");
    revalidatePath(`/[locale]/dashboard/budgets/${id}`);
    return {
      success: true,
      data: {
        ...budget,
        allocatedAmount: Number(budget.allocatedAmount),
      },
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: "Failed to update budget" };
  }
}

// Delete budget
export async function deleteBudget(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const existing = await prisma.budget.findUnique({
      where: { id },
      include: {
        expenses: true,
      },
    });

    if (!existing) {
      return { success: false, error: "Budget not found" };
    }

    // Only admins can delete budgets
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
        error: "Cannot delete budget with existing expenses",
      };
    }

    await prisma.budget.delete({
      where: { id },
    });

    revalidatePath("/[locale]/dashboard/budgets");
    return { success: true };
  } catch (error) {
    console.error("Error deleting budget:", error);
    return { success: false, error: "Failed to delete budget" };
  }
}

// Submit budget for approval
export async function submitBudgetForApproval(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const budget = await prisma.budget.findUnique({
      where: { id },
    });

    if (!budget) {
      return { success: false, error: "Budget not found" };
    }

    // Create approval records
    await prisma.$transaction(async (tx) => {
      // Find approvers (users with APPROVER or ADMIN role in the department)
      const approvers = await tx.user.findMany({
        where: {
          divisionId: budget.divisionId,
          role: {
            in: [UserRole.APPROVER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
          },
          isActive: true,
        },
      });

      // Create approval records
      for (let i = 0; i < approvers.length; i++) {
        await tx.approval.create({
          data: {
            type: "BUDGET",
            referenceId: id,
            budgetId: id,
            level: i + 1,
            approverId: approvers[i].id,
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: approvers[i].id,
            type: "BUDGET_APPROVAL",
            title: "New Budget Approval Request",
            titleLocal: "คำขออนุมัติงบประมาณใหม่",
            message: `Budget ${budget.code} - ${budget.name} requires your approval`,
            messageLocal: `งบประมาณ ${budget.code} - ${budget.nameLocal} ต้องการการอนุมัติของคุณ`,
            link: `/dashboard/budgets/${id}`,
          },
        });
      }
    });

    revalidatePath("/[locale]/dashboard/budgets");
    revalidatePath(`/[locale]/dashboard/budgets/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error submitting budget for approval:", error);
    return { success: false, error: "Failed to submit budget for approval" };
  }
}

// Get budget statistics for dashboard
export async function getBudgetStatistics(fiscalYear?: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const currentYear = fiscalYear || new Date().getFullYear();

    // Define the type for the where clause
    interface BudgetWhere {
      fiscalYear: number;
      divisionId?: string;
    }

    const where: BudgetWhere = { fiscalYear: currentYear };

    // Non-admins see only their department
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN
    ) {
      where.divisionId = session.user.divisionId;
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        expenses: {
          where: {
            status: {
              notIn: ["REJECTED", "CANCELLED"],
            },
          },
        },
      },
    });

    const totalBudget = budgets.reduce(
      (sum, b) => sum + Number(b.allocatedAmount),
      0
    );
    const totalSpent = budgets.reduce(
      (sum, b) => sum + b.expenses.reduce((s, e) => s + Number(e.amount), 0),
      0
    );

    return {
      success: true,
      data: {
        totalBudget,
        totalSpent,
        remaining: totalBudget - totalSpent,
        budgetCount: budgets.length,
      },
    };
  } catch (error) {
    console.error("Error fetching budget statistics:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}
