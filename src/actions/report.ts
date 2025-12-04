"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ExpenseStatus, UserRole } from "@prisma/client";

export async function getBudgetSummaryReport(fiscalYear?: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const currentYear = fiscalYear || new Date().getFullYear() + 543;

    const where: any = { fiscalYear: currentYear };

    // Non-admin users can only see their department's data
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN
    ) {
      where.divisionId = session.user.divisionId;
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        division: true,
        category: true,
        expenses: {
          where: {
            status: {
              notIn: [ExpenseStatus.REJECTED, ExpenseStatus.CANCELLED],
            },
          },
        },
      },
    });

    const summary = budgets.map((budget) => {
      const spent = budget.expenses.reduce(
        (sum, exp) => sum + Number(exp.amount),
        0
      );
      const allocated = Number(budget.allocatedAmount);
      const remaining = allocated - spent;

      return {
        budgetId: budget.id,
        code: budget.code,
        name: budget.name,
        department: budget.division.nameLocal || "Unknown",
        category: budget.category.name,
        allocated,
        spent,
        remaining,
        utilizationRate: allocated > 0 ? (spent / allocated) * 100 : 0,
        expenseCount: budget.expenses.length,
      };
    });

    const totals = {
      totalBudgets: summary.length,
      totalAllocated: summary.reduce((sum, b) => sum + b.allocated, 0),
      totalSpent: summary.reduce((sum, b) => sum + b.spent, 0),
      totalRemaining: summary.reduce((sum, b) => sum + b.remaining, 0),
      averageUtilization:
        summary.length > 0
          ? summary.reduce((sum, b) => sum + b.utilizationRate, 0) /
            summary.length
          : 0,
    };

    return {
      success: true,
      data: { summary, totals, fiscalYear: currentYear },
    };
  } catch (error) {
    console.error("Budget summary report error:", error);
    return {
      success: false,
      error: "Failed to generate budget summary report",
    };
  }
}

export async function getExpenseSummaryReport(params?: {
  startDate?: Date;
  endDate?: Date;
  divisionId?: string;
  categoryId?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const where: any = {
      status: {
        notIn: [ExpenseStatus.CANCELLED],
      },
    };

    // Filter by date range
    if (params?.startDate || params?.endDate) {
      where.expenseDate = {};
      if (params.startDate) {
        where.expenseDate.gte = params.startDate;
      }
      if (params.endDate) {
        where.expenseDate.lte = params.endDate;
      }
    }

    // Filter by department
    if (params?.divisionId) {
      where.divisionId = params.divisionId;
    } else if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN
    ) {
      where.divisionId = session.user.divisionId;
    }

    // Filter by category
    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        division: true,
        category: true,
        budget: true,
        createdBy: true,
      },
      orderBy: {
        expenseDate: "desc",
      },
    });

    // Group by category
    const byCategory = expenses.reduce((acc: any, expense) => {
      const categoryName = expense.category.name;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          categoryName,
          count: 0,
          total: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        };
      }
      acc[categoryName].count++;
      acc[categoryName].total += Number(expense.amount);

      if (
        expense.status === ExpenseStatus.APPROVED ||
        expense.status === ExpenseStatus.PAID
      ) {
        acc[categoryName].approved += Number(expense.amount);
      } else if (expense.status === ExpenseStatus.PENDING_APPROVAL) {
        acc[categoryName].pending += Number(expense.amount);
      } else if (expense.status === ExpenseStatus.REJECTED) {
        acc[categoryName].rejected += Number(expense.amount);
      }

      return acc;
    }, {});

    // Group by department
    const byDepartment = expenses.reduce((acc: any, expense) => {
      const deptName = expense.division.nameLocal || "Unknown";
      if (!acc[deptName]) {
        acc[deptName] = {
          departmentName: deptName,
          count: 0,
          total: 0,
        };
      }
      acc[deptName].count++;
      acc[deptName].total += Number(expense.amount);
      return acc;
    }, {});

    // Group by status
    const byStatus = expenses.reduce((acc: any, expense) => {
      const status = expense.status;
      if (!acc[status]) {
        acc[status] = {
          status,
          count: 0,
          total: 0,
        };
      }
      acc[status].count++;
      acc[status].total += Number(expense.amount);
      return acc;
    }, {});

    const totals = {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
      approvedAmount: expenses
        .filter(
          (exp) =>
            exp.status === ExpenseStatus.APPROVED ||
            exp.status === ExpenseStatus.PAID
        )
        .reduce((sum, exp) => sum + Number(exp.amount), 0),
      pendingAmount: expenses
        .filter((exp) => exp.status === ExpenseStatus.PENDING_APPROVAL)
        .reduce((sum, exp) => sum + Number(exp.amount), 0),
      rejectedAmount: expenses
        .filter((exp) => exp.status === ExpenseStatus.REJECTED)
        .reduce((sum, exp) => sum + Number(exp.amount), 0),
    };

    return {
      success: true,
      data: {
        expenses: expenses.slice(0, 100), // Limit to 100 recent expenses
        byCategory: Object.values(byCategory),
        byDepartment: Object.values(byDepartment),
        byStatus: Object.values(byStatus),
        totals,
      },
    };
  } catch (error) {
    console.error("Expense summary report error:", error);
    return {
      success: false,
      error: "Failed to generate expense summary report",
    };
  }
}

export async function getDepartmentAnalysisReport() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only admins can view all departments
    const departmentFilter: any = {};
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN
    ) {
      departmentFilter.id = session.user.divisionId;
    }

    const departments = await prisma.division.findMany({
      where: departmentFilter,
      include: {
        budgets: {
          include: {
            expenses: {
              where: {
                status: {
                  notIn: [ExpenseStatus.REJECTED, ExpenseStatus.CANCELLED],
                },
              },
            },
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

    const analysis = departments.map((dept) => {
      const totalAllocated = dept.budgets.reduce(
        (sum, budget) => sum + Number(budget.allocatedAmount),
        0
      );

      const totalSpent = dept.budgets.reduce(
        (sum, budget) =>
          sum +
          budget.expenses.reduce(
            (expSum, exp) => expSum + Number(exp.amount),
            0
          ),
        0
      );

      const activeBudgets = dept.budgets.length;

      return {
        divisionId: dept.id,
        departmentName: dept.nameLocal || "Unknown",
        // departmentCode: dept.code, // Removed code
        userCount: dept._count.users,
        budgetCount: dept._count.budgets,
        expenseCount: dept._count.expenses,
        activeBudgets,
        totalAllocated,
        totalSpent,
        remaining: totalAllocated - totalSpent,
        utilizationRate:
          totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0,
        averageBudgetSize:
          dept.budgets.length > 0 ? totalAllocated / dept.budgets.length : 0,
      };
    });

    // Sort by utilization rate
    analysis.sort((a, b) => b.utilizationRate - a.utilizationRate);

    const totals = {
      totalDepartments: analysis.length,
      totalUsers: analysis.reduce((sum, d) => sum + d.userCount, 0),
      totalBudgets: analysis.reduce((sum, d) => sum + d.budgetCount, 0),
      totalExpenses: analysis.reduce((sum, d) => sum + d.expenseCount, 0),
      totalAllocated: analysis.reduce((sum, d) => sum + d.totalAllocated, 0),
      totalSpent: analysis.reduce((sum, d) => sum + d.totalSpent, 0),
    };

    return { success: true, data: { analysis, totals } };
  } catch (error) {
    console.error("Department analysis report error:", error);
    return {
      success: false,
      error: "Failed to generate department analysis report",
    };
  }
}

export async function getApprovalTimelineReport(params?: {
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const where: any = {
      status: {
        notIn: ["PENDING"],
      },
      decidedAt: {
        not: null,
      },
    };

    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = params.startDate;
      }
      if (params.endDate) {
        where.createdAt.lte = params.endDate;
      }
    }

    const approvals = await prisma.approval.findMany({
      where,
      include: {
        approver: {
          include: {
            division: true,
          },
        },
        budget: true,
        expense: true,
      },
      orderBy: {
        decidedAt: "desc",
      },
    });

    const timeline = approvals
      .filter((approval) => approval.decidedAt)
      .map((approval) => {
        const createdAt = new Date(approval.createdAt);
        const decidedAt = new Date(approval.decidedAt!);
        const durationHours =
          (decidedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        return {
          approvalId: approval.id,
          type: approval.type,
          level: approval.level,
          status: approval.status,
          approverName: approval.approver.name,
          approverDivision: approval.approver.division?.nameLocal,
          itemName:
            approval.budget?.name || approval.expense?.title || "Unknown",
          createdAt,
          decidedAt,
          durationHours,
          durationDays: durationHours / 24,
        };
      });

    // Calculate statistics
    const approved = timeline.filter((t) => t.status === "APPROVED");
    const rejected = timeline.filter((t) => t.status === "REJECTED");

    const avgApprovalTime =
      approved.length > 0
        ? approved.reduce((sum, t) => sum + t.durationHours, 0) /
          approved.length
        : 0;

    const avgRejectionTime =
      rejected.length > 0
        ? rejected.reduce((sum, t) => sum + t.durationHours, 0) /
          rejected.length
        : 0;

    // Group by level
    const byLevel = timeline.reduce((acc: any, t) => {
      if (!acc[t.level]) {
        acc[t.level] = {
          level: t.level,
          count: 0,
          avgDuration: 0,
          totalDuration: 0,
        };
      }
      acc[t.level].count++;
      acc[t.level].totalDuration += t.durationHours;
      acc[t.level].avgDuration =
        acc[t.level].totalDuration / acc[t.level].count;
      return acc;
    }, {});

    const statistics = {
      totalApprovals: timeline.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      avgApprovalTime,
      avgRejectionTime,
      avgOverallTime:
        timeline.length > 0
          ? timeline.reduce((sum, t) => sum + t.durationHours, 0) /
            timeline.length
          : 0,
      byLevel: Object.values(byLevel),
    };

    return {
      success: true,
      data: {
        timeline: timeline.slice(0, 100), // Limit to 100 recent approvals
        statistics,
      },
    };
  } catch (error) {
    console.error("Approval timeline report error:", error);
    return {
      success: false,
      error: "Failed to generate approval timeline report",
    };
  }
}
