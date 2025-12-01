import { UserRole } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    nameLocal?: string | null;
    role: UserRole;
    departmentId: string;
    departmentName: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      nameLocal?: string | null;
      role: UserRole;
      departmentId: string;
      departmentName: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    departmentId: string;
    departmentName: string;
    nameLocal?: string | null;
  }
}
