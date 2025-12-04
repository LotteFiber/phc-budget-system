"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Get all active divisions
export async function getDivisions() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const divisions = await prisma.division.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        nameLocal: "asc",
      },
    });

    return { success: true, data: divisions };
  } catch (error) {
    console.error("Error fetching divisions:", error);
    return { success: false, error: "Failed to fetch divisions" };
  }
}

// Get all active budget categories
export async function getBudgetCategories() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const categories = await prisma.budgetCategory.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    return { success: true, data: categories };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, error: "Failed to fetch categories" };
  }
}

// Get active budgets for dropdown (for expense creation)
export async function getActiveBudgets(divisionId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const where: any = {
      status: {
        in: ["APPROVED", "ACTIVE"],
      },
    };

    if (divisionId) {
      where.divisionId = divisionId;
    }

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        category: true,
        expenses: {
          where: {
            status: {
              notIn: ["REJECTED", "CANCELLED"],
            },
          },
          select: {
            amount: true,
          },
        },
      },
      orderBy: {
        code: "asc",
      },
    });

    // Calculate remaining amount for each budget
    const budgetsWithRemaining = budgets.map((budget) => {
      const spent = budget.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      const remaining = Number(budget.allocatedAmount) - spent;

      return {
        id: budget.id,
        code: budget.code,
        name: budget.name,
        nameLocal: budget.nameLocal,
        allocatedAmount: Number(budget.allocatedAmount),
        spentAmount: spent,
        remainingAmount: remaining,
        categoryId: budget.categoryId,
      };
    });

    return { success: true, data: budgetsWithRemaining };
  } catch (error) {
    console.error("Error fetching active budgets:", error);
    return { success: false, error: "Failed to fetch active budgets" };
  }
}

// Get notifications for current user
export async function getNotifications(unreadOnly = false) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const where: any = {
      userId: session.user.id,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Limit to recent 50
    });

    return { success: true, data: notifications };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: "Failed to mark notification as read" };
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: "Failed to mark all notifications as read" };
  }
}

// Get fiscal years with budgets
export async function getFiscalYears() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const budgets = await prisma.budget.findMany({
      select: {
        fiscalYear: true,
      },
      distinct: ["fiscalYear"],
      orderBy: {
        fiscalYear: "desc",
      },
    });

    const years = budgets.map((b) => b.fiscalYear);
    return { success: true, data: years };
  } catch (error) {
    console.error("Error fetching fiscal years:", error);
    return { success: false, error: "Failed to fetch fiscal years" };
  }
}

// Get all active plans
export async function getPlans() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const plans = await prisma.plan.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    return { success: true, data: plans };
  } catch (error) {
    console.error("Error fetching plans:", error);
    return { success: false, error: "Failed to fetch plans" };
  }
}

// Get all active outputs
export async function getOutputs() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const outputs = await prisma.output.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    return { success: true, data: outputs };
  } catch (error) {
    console.error("Error fetching outputs:", error);
    return { success: false, error: "Failed to fetch outputs" };
  }
}

// Get all active activities
export async function getActivities() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const activities = await prisma.activity.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    return { success: true, data: activities };
  } catch (error) {
    console.error("Error fetching activities:", error);
    return { success: false, error: "Failed to fetch activities" };
  }
}
