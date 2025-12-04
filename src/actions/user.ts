"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  nameLocal: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "APPROVER", "STAFF", "VIEWER"]),
  divisionId: z.string().min(1, "Division is required"),
  isActive: z.boolean().default(true),
});

type UserInput = z.infer<typeof userSchema>;

export async function getUsers() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const users = await prisma.user.findMany({
      include: {
        division: true,
        _count: {
          select: {
            createdBudgets: true,
            createdExpenses: true,
            approvals: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Get users error:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function getUserById(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        division: true,
        createdBudgets: {
          include: {
            category: true,
            division: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        createdExpenses: {
          include: {
            category: true,
            budget: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        _count: {
          select: {
            createdBudgets: true,
            createdExpenses: true,
            approvals: true,
            notifications: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return { success: true, data: userWithoutPassword };
  } catch (error) {
    console.error("Get user error:", error);
    return { success: false, error: "Failed to fetch user" };
  }
}

export async function createUser(data: UserInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only SUPER_ADMIN and ADMIN can create users
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN
    ) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    const validatedData = userSchema.parse(data);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return { success: false, error: "Email already exists" };
    }

    // Hash password
    if (!validatedData.password) {
      return { success: false, error: "Password is required" };
    }
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        nameLocal: validatedData.nameLocal || null,
        password: hashedPassword,
        role: validatedData.role as UserRole,
        divisionId: validatedData.divisionId,
        isActive: validatedData.isActive,
      },
      include: {
        division: true,
      },
    });

    revalidatePath("/dashboard/users");

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return { success: true, data: userWithoutPassword };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation error",
      };
    }
    console.error("Create user error:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUser(id: string, data: Partial<UserInput>) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return { success: false, error: "User not found" };
    }

    // Only SUPER_ADMIN and ADMIN can update users, or users can update themselves (limited fields)
    const isSelfUpdate = session.user.id === id;
    const isAdmin =
      session.user.role === UserRole.SUPER_ADMIN ||
      session.user.role === UserRole.ADMIN;

    if (!isSelfUpdate && !isAdmin) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    const validatedData = userSchema.partial().parse(data);

    // If updating email, check if it's already taken
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return { success: false, error: "Email already exists" };
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (validatedData.email) updateData.email = validatedData.email;
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.nameLocal !== undefined) updateData.nameLocal = validatedData.nameLocal || null;

    // Only admins can update role, division, and isActive
    if (isAdmin) {
      if (validatedData.role) updateData.role = validatedData.role as UserRole;
      if (validatedData.divisionId) updateData.divisionId = validatedData.divisionId;
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    }

    // Hash password if provided
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        division: true,
      },
    });

    revalidatePath("/dashboard/users");
    revalidatePath(`/dashboard/users/${id}`);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return { success: true, data: userWithoutPassword };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Validation error",
      };
    }
    console.error("Update user error:", error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function deleteUser(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only SUPER_ADMIN can delete users
    if (session.user.role !== UserRole.SUPER_ADMIN) {
      return { success: false, error: "Only Super Admin can delete users" };
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            createdBudgets: true,
            createdExpenses: true,
            approvals: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Prevent deletion if user has created budgets or expenses
    if (user._count.createdBudgets > 0) {
      return { success: false, error: "Cannot delete user with created budgets" };
    }

    if (user._count.createdExpenses > 0) {
      return { success: false, error: "Cannot delete user with created expenses" };
    }

    // Prevent self-deletion
    if (user.id === session.user.id) {
      return { success: false, error: "Cannot delete your own account" };
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (error) {
    console.error("Delete user error:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

export async function toggleUserStatus(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only SUPER_ADMIN and ADMIN can toggle user status
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN
    ) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Prevent self-deactivation
    if (user.id === session.user.id) {
      return { success: false, error: "Cannot deactivate your own account" };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: !user.isActive,
      },
    });

    revalidatePath("/dashboard/users");
    revalidatePath(`/dashboard/users/${id}`);

    return { success: true, data: { isActive: updatedUser.isActive } };
  } catch (error) {
    console.error("Toggle user status error:", error);
    return { success: false, error: "Failed to toggle user status" };
  }
}

export async function assignUserToDivision(userId: string, divisionId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only SUPER_ADMIN and ADMIN can assign users to divisions
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN
    ) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if division exists
    const division = await prisma.division.findUnique({
      where: { id: divisionId },
    });

    if (!division) {
      return { success: false, error: "Division not found" };
    }

    // Update user's division
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        divisionId,
      },
      include: {
        division: true,
      },
    });

    revalidatePath("/dashboard/users");
    revalidatePath(`/dashboard/users/${userId}`);
    revalidatePath("/dashboard/divisions");
    revalidatePath(`/dashboard/divisions/${divisionId}`);

    return {
      success: true,
      data: {
        userId: updatedUser.id,
        userName: updatedUser.name,
        divisionName: updatedUser.division.nameLocal,
      },
    };
  } catch (error) {
    console.error("Assign user to division error:", error);
    return { success: false, error: "Failed to assign user to division" };
  }
}

export async function getUsersNotInDivision(divisionId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Only SUPER_ADMIN and ADMIN can view this
    if (
      session.user.role !== UserRole.SUPER_ADMIN &&
      session.user.role !== UserRole.ADMIN
    ) {
      return { success: false, error: "Insufficient permissions" };
    }

    const users = await prisma.user.findMany({
      where: {
        divisionId: {
          not: divisionId,
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        nameLocal: true,
        email: true,
        role: true,
        division: {
          select: {
            nameLocal: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, data: users };
  } catch (error) {
    console.error("Get users not in division error:", error);
    return { success: false, error: "Failed to fetch users" };
  }
}
