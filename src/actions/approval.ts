"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ApprovalStatus, ExpenseStatus, UserRole } from "@prisma/client";

// Get pending approvals for current user
export async function getPendingApprovals() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Only approvers and admins can see approvals
    if (
      session.user.role !== UserRole.APPROVER &&
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.SUPER_ADMIN
    ) {
      return { success: false, error: "Insufficient permissions" };
    }

    const approvals = await prisma.approval.findMany({
      where: {
        approverId: session.user.id,
        status: ApprovalStatus.PENDING,
      },
      include: {
        budget: {
          include: {
            division: true,
            category: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        expense: {
          include: {
            budget: true,
            division: true,
            category: true,
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: approvals };
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    return { success: false, error: "Failed to fetch pending approvals" };
  }
}

// Get approval count for current user
export async function getPendingApprovalCount() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (
      session.user.role !== UserRole.APPROVER &&
      session.user.role !== UserRole.ADMIN &&
      session.user.role !== UserRole.SUPER_ADMIN
    ) {
      return { success: true, data: { count: 0 } };
    }

    const count = await prisma.approval.count({
      where: {
        approverId: session.user.id,
        status: ApprovalStatus.PENDING,
      },
    });

    return { success: true, data: { count } };
  } catch (error) {
    console.error("Error fetching approval count:", error);
    return { success: false, error: "Failed to fetch approval count" };
  }
}

// Approve budget
export async function approveBudget(approvalId: string, comments?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        budget: true,
      },
    });

    if (!approval) {
      return { success: false, error: "Approval not found" };
    }

    if (approval.approverId !== session.user.id) {
      return { success: false, error: "Access denied" };
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      return { success: false, error: "Approval already processed" };
    }

    if (!approval.budgetId) {
      return { success: false, error: "Invalid approval type" };
    }

    await prisma.$transaction(async (tx) => {
      // Update approval
      await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: ApprovalStatus.APPROVED,
          comments,
          decidedAt: new Date(),
        },
      });

      // Check if all approvals are complete
      const allApprovals = await tx.approval.findMany({
        where: {
          budgetId: approval.budgetId,
          type: "BUDGET",
        },
      });

      const allApproved = allApprovals.every(
        (a) => a.status === ApprovalStatus.APPROVED || a.id === approvalId
      );

      if (allApproved && approval.budgetId) {
        // Notify creator
        if (approval.budget) {
          await tx.notification.create({
            data: {
              userId: approval.budget.createdById,
              type: "BUDGET_APPROVED",
              title: "Budget Approved",
              titleLocal: "งบประมาณได้รับการอนุมัติ",
              message: `Your budget ${approval.budget.code} has been approved`,
              messageLocal: `งบประมาณของคุณ ${approval.budget.code} ได้รับการอนุมัติแล้ว`,
              link: `/dashboard/budgets/${approval.budgetId}`,
            },
          });
        }
      }
    });

    revalidatePath("/[locale]/dashboard/approvals");
    revalidatePath(`/[locale]/dashboard/budgets/${approval.budgetId}`);
    return { success: true };
  } catch (error) {
    console.error("Error approving budget:", error);
    return { success: false, error: "Failed to approve budget" };
  }
}

// Reject budget
export async function rejectBudget(approvalId: string, comments: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (!comments) {
      return { success: false, error: "Comments required for rejection" };
    }

    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        budget: true,
      },
    });

    if (!approval) {
      return { success: false, error: "Approval not found" };
    }

    if (approval.approverId !== session.user.id) {
      return { success: false, error: "Access denied" };
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      return { success: false, error: "Approval already processed" };
    }

    if (!approval.budgetId) {
      return { success: false, error: "Invalid approval type" };
    }

    await prisma.$transaction(async (tx) => {
      // Update approval
      await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: ApprovalStatus.REJECTED,
          comments,
          decidedAt: new Date(),
        },
      });

      if (approval.budgetId) {
        // Cancel other pending approvals
        await tx.approval.updateMany({
          where: {
            budgetId: approval.budgetId,
            type: "BUDGET",
            status: ApprovalStatus.PENDING,
          },
          data: {
            status: ApprovalStatus.REJECTED,
            comments: "Auto-rejected due to rejection by another approver",
          },
        });

        // Notify creator
        if (approval.budget) {
          await tx.notification.create({
            data: {
              userId: approval.budget.createdById,
              type: "BUDGET_REJECTED",
              title: "Budget Rejected",
              titleLocal: "งบประมาณถูกปฏิเสธ",
              message: `Your budget ${approval.budget.code} has been rejected: ${comments}`,
              messageLocal: `งบประมาณของคุณ ${approval.budget.code} ถูกปฏิเสธ: ${comments}`,
              link: `/dashboard/budgets/${approval.budgetId}`,
            },
          });
        }
      }
    });

    revalidatePath("/[locale]/dashboard/approvals");
    revalidatePath(`/[locale]/dashboard/budgets/${approval.budgetId}`);
    return { success: true };
  } catch (error) {
    console.error("Error rejecting budget:", error);
    return { success: false, error: "Failed to reject budget" };
  }
}

// Approve expense
export async function approveExpense(approvalId: string, comments?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        expense: true,
      },
    });

    if (!approval) {
      return { success: false, error: "Approval not found" };
    }

    if (approval.approverId !== session.user.id) {
      return { success: false, error: "Access denied" };
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      return { success: false, error: "Approval already processed" };
    }

    if (!approval.expenseId) {
      return { success: false, error: "Invalid approval type" };
    }

    await prisma.$transaction(async (tx) => {
      // Update approval
      await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: ApprovalStatus.APPROVED,
          comments,
          decidedAt: new Date(),
        },
      });

      // Check if all approvals are complete
      const allApprovals = await tx.approval.findMany({
        where: {
          expenseId: approval.expenseId,
          type: "EXPENSE",
        },
      });

      const allApproved = allApprovals.every(
        (a) => a.status === ApprovalStatus.APPROVED || a.id === approvalId
      );

      if (allApproved && approval.expenseId) {
        // Update expense status to approved
        await tx.expense.update({
          where: { id: approval.expenseId },
          data: { status: ExpenseStatus.APPROVED },
        });

        // Notify creator
        if (approval.expense) {
          await tx.notification.create({
            data: {
              userId: approval.expense.createdById,
              type: "EXPENSE_APPROVED",
              title: "Expense Approved",
              titleLocal: "ค่าใช้จ่ายได้รับการอนุมัติ",
              message: `Your expense ${approval.expense.code} has been approved`,
              messageLocal: `ค่าใช้จ่ายของคุณ ${approval.expense.code} ได้รับการอนุมัติแล้ว`,
              link: `/dashboard/expenses/${approval.expenseId}`,
            },
          });
        }
      }
    });

    revalidatePath("/[locale]/dashboard/approvals");
    revalidatePath(`/[locale]/dashboard/expenses/${approval.expenseId}`);
    return { success: true };
  } catch (error) {
    console.error("Error approving expense:", error);
    return { success: false, error: "Failed to approve expense" };
  }
}

// Reject expense
export async function rejectExpense(approvalId: string, comments: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    if (!comments) {
      return { success: false, error: "Comments required for rejection" };
    }

    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        expense: true,
      },
    });

    if (!approval) {
      return { success: false, error: "Approval not found" };
    }

    if (approval.approverId !== session.user.id) {
      return { success: false, error: "Access denied" };
    }

    if (approval.status !== ApprovalStatus.PENDING) {
      return { success: false, error: "Approval already processed" };
    }

    if (!approval.expenseId) {
      return { success: false, error: "Invalid approval type" };
    }

    await prisma.$transaction(async (tx) => {
      // Update approval
      await tx.approval.update({
        where: { id: approvalId },
        data: {
          status: ApprovalStatus.REJECTED,
          comments,
          decidedAt: new Date(),
        },
      });

      if (approval.expenseId) {
        // Update expense status to rejected
        await tx.expense.update({
          where: { id: approval.expenseId },
          data: { status: ExpenseStatus.REJECTED },
        });

        // Cancel other pending approvals
        await tx.approval.updateMany({
          where: {
            expenseId: approval.expenseId,
            type: "EXPENSE",
            status: ApprovalStatus.PENDING,
          },
          data: {
            status: ApprovalStatus.REJECTED,
            comments: "Auto-rejected due to rejection by another approver",
          },
        });

        // Notify creator
        if (approval.expense) {
          await tx.notification.create({
            data: {
              userId: approval.expense.createdById,
              type: "EXPENSE_REJECTED",
              title: "Expense Rejected",
              titleLocal: "ค่าใช้จ่ายถูกปฏิเสธ",
              message: `Your expense ${approval.expense.code} has been rejected: ${comments}`,
              messageLocal: `ค่าใช้จ่ายของคุณ ${approval.expense.code} ถูกปฏิเสธ: ${comments}`,
              link: `/dashboard/expenses/${approval.expenseId}`,
            },
          });
        }
      }
    });

    revalidatePath("/[locale]/dashboard/approvals");
    revalidatePath(`/[locale]/dashboard/expenses/${approval.expenseId}`);
    return { success: true };
  } catch (error) {
    console.error("Error rejecting expense:", error);
    return { success: false, error: "Failed to reject expense" };
  }
}
