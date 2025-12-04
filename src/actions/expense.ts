"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ExpenseStatus, UserRole } from "@prisma/client";
import { z } from "zod";

// Validation schema
const expenseSchema = z.object({
  code: z.string().min(1, "Expense code is required"),
  budgetId: z.string().min(1, "Budget is required"),
  categoryId: z.string().min(1, "Category is required"),
  divisionId: z.string().min(1, "Division is required"),
  title: z.string().min(1, "Title is required"),
  titleLocal: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  descriptionLocal: z.string().optional(),
  amount: z.number().positive("Amount must be positive"),
  expenseDate: z.date(),
});

type ExpenseInput = z.infer<typeof expenseSchema>;

// Get all expenses with filters
export async function getExpenses(filters?: {
  budgetId?: string;
  divisionId?: string;
  status?: ExpenseStatus;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const where: any = {};

    // Non-admins can only see their division's expenses
    if (session.user.role !== UserRole.SUPER_ADMIN && session.user.role !== UserRole.ADMIN) {
      where.divisionId = session.user.divisionId;
    } else if (filters?.divisionId) {
      where.divisionId = filters.divisionId;
    }

    if (filters?.budgetId) {
      where.budgetId = filters.budgetId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { code: { contains: filters.search, mode: "insensitive" } },
        { title: { contains: filters.search, mode: "insensitive" } },
        { titleLocal: { contains: filters.search } },
      ];
    }

    if (filters?.startDate || filters?.endDate) {
      where.expenseDate = {};
      if (filters.startDate) {
        where.expenseDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.expenseDate.lte = filters.endDate;
      }
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        budget: {
          select: {
            id: true,
            code: true,
            name: true,
            nameLocal: true,
          },
        },
        category: {
          select: {
            id: true,
            code: true,
            name: true,
            nameLocal: true,
          },
        },
        division: {
          select: {
            id: true,
            nameLocal: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        documents: true,
      },
      orderBy: {
        expenseDate: "desc",
      },
    });

    return { success: true, data: expenses };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return { success: false, error: "Failed to fetch expenses" };
  }
}

// Get single expense by ID
export async function getExpenseById(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        budget: true,
        category: true,
        division: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        documents: true,
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

    if (!expense) {
      return { success: false, error: "Expense not found" };
    }

    // Check access permissions
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN &&
      expense.divisionId !== session.user.divisionId
    ) {
      return { success: false, error: "Access denied" };
    }

    return { success: true, data: expense };
  } catch (error) {
    console.error("Error fetching expense:", error);
    return { success: false, error: "Failed to fetch expense" };
  }
}

// Create new expense
export async function createExpense(data: ExpenseInput) {
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
    const validated = expenseSchema.parse(data);

    // Check for duplicate code
    const existing = await prisma.expense.findUnique({
      where: { code: validated.code },
    });

    if (existing) {
      return { success: false, error: "Expense code already exists" };
    }

    // Verify budget exists and has sufficient funds
    const budget = await prisma.budget.findUnique({
      where: { id: validated.budgetId },
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

    if (!budget) {
      return { success: false, error: "Budget not found" };
    }

    // Calculate remaining budget
    const totalSpent = budget.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const remaining = Number(budget.allocatedAmount) - totalSpent;

    if (validated.amount > remaining) {
      return {
        success: false,
        error: `Insufficient budget. Remaining: ฿${remaining.toFixed(2)}`,
      };
    }

    const expense = await prisma.expense.create({
      data: {
        ...validated,
        createdById: session.user.id,
      },
      include: {
        budget: true,
        category: true,
        division: true,
      },
    });

    revalidatePath("/[locale]/dashboard/expenses");
    return { success: true, data: expense };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || "Validation error" };
    }
    console.error("Error creating expense:", error);
    return { success: false, error: "Failed to create expense" };
  }
}

// Update expense
export async function updateExpense(id: string, data: Partial<ExpenseInput>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const existing = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Expense not found" };
    }

    // Check permissions
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN &&
      existing.createdById !== session.user.id
    ) {
      return { success: false, error: "Access denied" };
    }

    // Can't edit approved or paid expenses unless admin
    if (
      (existing.status === ExpenseStatus.APPROVED || existing.status === ExpenseStatus.PAID) &&
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN
    ) {
      return { success: false, error: "Cannot edit approved or paid expenses" };
    }

    const expense = await prisma.expense.update({
      where: { id },
      data,
      include: {
        budget: true,
        category: true,
        division: true,
      },
    });

    revalidatePath("/[locale]/dashboard/expenses");
    revalidatePath(`/[locale]/dashboard/expenses/${id}`);
    return { success: true, data: expense };
  } catch (error) {
    console.error("Error updating expense:", error);
    return { success: false, error: "Failed to update expense" };
  }
}

// Delete expense
export async function deleteExpense(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const existing = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: "Expense not found" };
    }

    // Check permissions
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN &&
      existing.createdById !== session.user.id
    ) {
      return { success: false, error: "Access denied" };
    }

    // Can only delete draft expenses
    if (existing.status !== ExpenseStatus.DRAFT) {
      return { success: false, error: "Only draft expenses can be deleted" };
    }

    await prisma.expense.delete({
      where: { id },
    });

    revalidatePath("/[locale]/dashboard/expenses");
    return { success: true };
  } catch (error) {
    console.error("Error deleting expense:", error);
    return { success: false, error: "Failed to delete expense" };
  }
}

// Submit expense for approval
export async function submitExpenseForApproval(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        budget: true,
      },
    });

    if (!expense) {
      return { success: false, error: "Expense not found" };
    }

    if (expense.status !== ExpenseStatus.DRAFT) {
      return { success: false, error: "Only draft expenses can be submitted" };
    }

    // Update expense status and create approval records
    await prisma.$transaction(async (tx) => {
      await tx.expense.update({
        where: { id },
        data: { status: ExpenseStatus.PENDING_APPROVAL },
      });

      // Find approvers
      const approvers = await tx.user.findMany({
        where: {
          divisionId: expense.divisionId,
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
            type: "EXPENSE",
            referenceId: id,
            expenseId: id,
            level: i + 1,
            approverId: approvers[i].id,
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: approvers[i].id,
            type: "EXPENSE_APPROVAL",
            title: "New Expense Approval Request",
            titleLocal: "คำขออนุมัติค่าใช้จ่ายใหม่",
            message: `Expense ${expense.code} - ${expense.title} requires your approval`,
            messageLocal: `ค่าใช้จ่าย ${expense.code} - ${expense.titleLocal || expense.title} ต้องการการอนุมัติของคุณ`,
            link: `/dashboard/expenses/${id}`,
          },
        });
      }
    });

    revalidatePath("/[locale]/dashboard/expenses");
    revalidatePath(`/[locale]/dashboard/expenses/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Error submitting expense for approval:", error);
    return { success: false, error: "Failed to submit expense for approval" };
  }
}

// Add document to expense
export async function addExpenseDocument(
  expenseId: string,
  data: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return { success: false, error: "Expense not found" };
    }

    const document = await prisma.expenseDocument.create({
      data: {
        expenseId,
        ...data,
      },
    });

    revalidatePath(`/[locale]/dashboard/expenses/${expenseId}`);
    return { success: true, data: document };
  } catch (error) {
    console.error("Error adding document:", error);
    return { success: false, error: "Failed to add document" };
  }
}

// Delete expense document
export async function deleteExpenseDocument(documentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const document = await prisma.expenseDocument.findUnique({
      where: { id: documentId },
      include: {
        expense: true,
      },
    });

    if (!document) {
      return { success: false, error: "Document not found" };
    }

    // Check permissions
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN &&
      document.expense.createdById !== session.user.id
    ) {
      return { success: false, error: "Access denied" };
    }

    await prisma.expenseDocument.delete({
      where: { id: documentId },
    });

    revalidatePath(`/[locale]/dashboard/expenses/${document.expenseId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return { success: false, error: "Failed to delete document" };
  }
}
