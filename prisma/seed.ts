import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting seed...");

  // Create departments
  const mainDept = await prisma.department.create({
    data: {
      code: "PHC-001",
      name: "Primary Health Care Division",
      nameLocal: "กองสุขภาพปฐมภูมิ",
      isActive: true,
    },
  });

  const subDept1 = await prisma.department.create({
    data: {
      code: "PHC-002",
      name: "Health Promotion Department",
      nameLocal: "ฝ่ายส่งเสริมสุขภาพ",
      parentId: mainDept.id,
      isActive: true,
    },
  });

  const subDept2 = await prisma.department.create({
    data: {
      code: "PHC-003",
      name: "Disease Prevention Department",
      nameLocal: "ฝ่ายป้องกันโรค",
      parentId: mainDept.id,
      isActive: true,
    },
  });

  console.log("Created departments");

  // Create budget categories
  const category1 = await prisma.budgetCategory.create({
    data: {
      code: "CAT-001",
      name: "Personnel Expenses",
      nameLocal: "ค่าใช้จ่ายบุคลากร",
      description: "Salaries, benefits, and personnel-related costs",
      isActive: true,
    },
  });

  const category2 = await prisma.budgetCategory.create({
    data: {
      code: "CAT-002",
      name: "Operating Expenses",
      nameLocal: "ค่าใช้จ่ายดำเนินงาน",
      description: "Day-to-day operational costs",
      isActive: true,
    },
  });

  const category3 = await prisma.budgetCategory.create({
    data: {
      code: "CAT-003",
      name: "Equipment & Supplies",
      nameLocal: "ค่าครุภัณฑ์และวัสดุ",
      description: "Medical equipment and supplies",
      isActive: true,
    },
  });

  console.log("Created budget categories");

  // Create users with hashed passwords
  const hashedPassword = await bcrypt.hash("password123", 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@phc.go.th",
      password: hashedPassword,
      name: "System Administrator",
      nameLocal: "ผู้ดูแลระบบ",
      role: UserRole.SUPER_ADMIN,
      departmentId: mainDept.id,
      isActive: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: "dept.admin@phc.go.th",
      password: hashedPassword,
      name: "Department Admin",
      nameLocal: "ผู้ดูแลแผนก",
      role: UserRole.ADMIN,
      departmentId: subDept1.id,
      isActive: true,
    },
  });

  const approver = await prisma.user.create({
    data: {
      email: "approver@phc.go.th",
      password: hashedPassword,
      name: "Budget Approver",
      nameLocal: "ผู้อนุมัติงบประมาณ",
      role: UserRole.APPROVER,
      departmentId: mainDept.id,
      isActive: true,
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: "staff@phc.go.th",
      password: hashedPassword,
      name: "Staff Member",
      nameLocal: "เจ้าหน้าที่",
      role: UserRole.STAFF,
      departmentId: subDept1.id,
      isActive: true,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: "viewer@phc.go.th",
      password: hashedPassword,
      name: "Report Viewer",
      nameLocal: "ผู้ดูรายงาน",
      role: UserRole.VIEWER,
      departmentId: subDept2.id,
      isActive: true,
    },
  });

  console.log("Created users");

  // Create sample budget
  const budget = await prisma.budget.create({
    data: {
      code: "BUD-2025-001",
      name: "FY2025 Health Promotion Budget",
      nameLocal: "งบประมาณส่งเสริมสุขภาพ ปี 2568",
      description: "Annual budget for health promotion activities",
      descriptionLocal: "งบประมาณประจำปีสำหรับกิจกรรมส่งเสริมสุขภาพ",
      fiscalYear: 2025,
      departmentId: subDept1.id,
      categoryId: category2.id,
      allocatedAmount: 5000000, // 5 million baht
      status: "APPROVED",
      startDate: new Date("2024-10-01"),
      endDate: new Date("2025-09-30"),
      createdById: admin.id,
    },
  });

  console.log("Created sample budget");

  console.log("Seed completed successfully!");
  console.log("\nTest accounts:");
  console.log("=================================");
  console.log("Super Admin: admin@phc.go.th");
  console.log("Admin: dept.admin@phc.go.th");
  console.log("Approver: approver@phc.go.th");
  console.log("Staff: staff@phc.go.th");
  console.log("Viewer: viewer@phc.go.th");
  console.log("Password for all: password123");
  console.log("=================================");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
