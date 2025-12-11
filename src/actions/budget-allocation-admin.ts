"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { z } from "zod";

// Validation schema for admin budget allocation form
const budgetAllocationFormSchema = z.object({
  fiscalYear: z.number().int().min(2543).max(2643), // Buddhist calendar years
  divisionId: z.string().min(1, "Division is required"),
  categoryId: z.string().min(1, "Category is required"),
  planId: z.string().optional(),
  outputId: z.string().optional(),
  activityId: z.string().optional(),
  allocatedAmount: z.number().positive("Amount must be positive"),
  // Custom name fields
  customPlanName: z.string().optional(),
  customOutputName: z.string().optional(),
  customActivityName: z.string().optional(),
}).refine(
  (data) => data.planId || data.customPlanName,
  { message: "Plan is required", path: ["planId"] }
).refine(
  (data) => data.outputId || data.customOutputName,
  { message: "Output is required", path: ["outputId"] }
).refine(
  (data) => data.activityId || data.customActivityName,
  { message: "Activity is required", path: ["activityId"] }
);

// Full schema for database operations
const budgetSchema = z.object({
  code: z.string().min(1, "Budget code is required"),
  name: z.string().min(1, "Budget name is required"),
  nameLocal: z.string().min(1, "Thai budget name is required"),
  description: z.string().optional(),
  descriptionLocal: z.string().optional(),
  fiscalYear: z.number().int().min(2543).max(2643),
  divisionId: z.string().min(1, "Division is required"),
  categoryId: z.string().min(1, "Category is required"),
  planId: z.string().min(1, "Plan is required"),
  outputId: z.string().min(1, "Output is required"),
  activityId: z.string().min(1, "Activity is required"),
  allocatedAmount: z.number().positive("Amount must be positive"),
  startDate: z.date(),
  endDate: z.date(),
});

type BudgetAllocationFormInput = z.infer<typeof budgetAllocationFormSchema>;
type BudgetInput = z.infer<typeof budgetSchema>;

// Create new budget allocation (Admin only)
export async function createBudgetAllocation(data: BudgetAllocationFormInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Only Admin and Super Admin can create budget allocations
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.ADMIN) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate form input
    const formData = budgetAllocationFormSchema.parse(data);

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
        return { success: false, error: "Output is required to create Activity" };
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
      activityId ? prisma.activity.findUnique({ where: { id: activityId } }) : null,
    ]);

    if (!plan || !output || !activity) {
      return { success: false, error: "Invalid plan, output, or activity" };
    }

    // Use fetched names if not already set
    if (!planNameLocal) planNameLocal = plan.nameLocal;
    if (!activityNameLocal) activityNameLocal = activity.nameLocal;

    // Generate auto-filled values
    const timestamp = Date.now().toString(36).toUpperCase();
    const code = `BUDG-${formData.fiscalYear}-${timestamp}`;
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
      divisionId: formData.divisionId, // Use the selected division
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

    revalidatePath("/[locale]/dashboard/budget-allocations");
    return {
      success: true,
      data: {
        ...budget,
        allocatedAmount: Number(budget.allocatedAmount),
      }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Error creating budget allocation:", error);
    return { success: false, error: "Failed to create budget allocation" };
  }
}

// Update budget allocation (Admin only)
export async function updateBudgetAllocation(id: string, data: Partial<BudgetAllocationFormInput>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Only Admin and Super Admin can update budget allocations
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.ADMIN) {
      return { success: false, error: "Insufficient permissions" };
    }

    const existing = await prisma.budget.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Budget allocation not found" };
    }

    // Prepare update data
    const updateData: any = { ...data };

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

    revalidatePath("/[locale]/dashboard/budget-allocations");
    revalidatePath(`/[locale]/dashboard/budget-allocations/${id}`);
    return {
      success: true,
      data: {
        ...budget,
        allocatedAmount: Number(budget.allocatedAmount),
      }
    };
  } catch (error) {
    console.error("Error updating budget allocation:", error);
    return { success: false, error: "Failed to update budget allocation" };
  }
}
