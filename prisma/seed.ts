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

  // Delete existing data in correct order to avoid foreign key constraints
  await prisma.approval.deleteMany({});
  await prisma.budgetAllocation.deleteMany({});
  await prisma.budget.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.output.deleteMany({});
  await prisma.plan.deleteMany({});
  await prisma.budgetCategory.deleteMany({});
  await prisma.division.deleteMany({});

  const [mainDept] = await prisma.division.createManyAndReturn({
    data: [
      {
        nameLocal: "กองสุขภาพปฐมภูมิ",
        descriptionLocal: "กองสุขภาพปฐมภูมิ",
        isActive: true,
      },
    ],
  });

  console.log("Created divisions");

  // Create or update budget categories
  const category1 = await prisma.budgetCategory.upsert({
    where: { code: "CAT-001" },
    update: {
      name: "Operating Budget",
      nameLocal: "งบดำเนินงาน",
      description:
        "Expenses for day-to-day operations including utilities, supplies, maintenance, and administrative costs",
      isActive: true,
    },
    create: {
      code: "CAT-001",
      name: "Operating Budget",
      nameLocal: "งบดำเนินงาน",
      description:
        "Expenses for day-to-day operations including utilities, supplies, maintenance, and administrative costs",
      isActive: true,
    },
  });

  const category2 = await prisma.budgetCategory.upsert({
    where: { code: "CAT-002" },
    update: {
      name: "Subsidy Budget",
      nameLocal: "งบเงินอุดหนุน",
      description:
        "Financial assistance or grants provided to organizations, institutions, or individuals to support specific programs or activities",
      isActive: true,
    },
    create: {
      code: "CAT-002",
      name: "Subsidy Budget",
      nameLocal: "งบเงินอุดหนุน",
      description:
        "Financial assistance or grants provided to organizations, institutions, or individuals to support specific programs or activities",
      isActive: true,
    },
  });

  const category3 = await prisma.budgetCategory.upsert({
    where: { code: "CAT-003" },
    update: {
      name: "Investment Budget",
      nameLocal: "งบลงทุน",
      description:
        "Capital expenditures for acquiring or improving long-term assets such as buildings, equipment, infrastructure, and technology",
      isActive: true,
    },
    create: {
      code: "CAT-003",
      name: "Investment Budget",
      nameLocal: "งบลงทุน",
      description:
        "Capital expenditures for acquiring or improving long-term assets such as buildings, equipment, infrastructure, and technology",
      isActive: true,
    },
  });

  console.log("Upserted budget categories");

  // Create or update plans
  const plan1 = await prisma.plan.upsert({
    where: { code: "PLAN-001" },
    update: {
      name: "Strategic Plan for Health Promotion",
      nameLocal: "แผนงานยุทธศาสตร์เสริมสร้างให้คนมีสุขภาวะที่ดี",
      description: "Strategic plan to promote health and well-being",
      isActive: true,
    },
    create: {
      code: "PLAN-001",
      name: "Strategic Plan for Health Promotion",
      nameLocal: "แผนงานยุทธศาสตร์เสริมสร้างให้คนมีสุขภาวะที่ดี",
      description: "Strategic plan to promote health and well-being",
      isActive: true,
    },
  });

  const plan2 = await prisma.plan.upsert({
    where: { code: "PLAN-002" },
    update: {
      name: "Fundamental Plan for Human Resource Development",
      nameLocal: "แผนงานพื้นฐานด้านการพัฒนาและเสริมสร้างศักยภาพทรัพยากรมนุษย์",
      description:
        "Fundamental plan for developing and strengthening human resource capacity",
      isActive: true,
    },
    create: {
      code: "PLAN-002",
      name: "Fundamental Plan for Human Resource Development",
      nameLocal: "แผนงานพื้นฐานด้านการพัฒนาและเสริมสร้างศักยภาพทรัพยากรมนุษย์",
      description:
        "Fundamental plan for developing and strengthening human resource capacity",
      isActive: true,
    },
  });

  console.log("Upserted plans");

  // Create or update outputs
  const output1 = await prisma.output.upsert({
    where: { code: "OUT-001" },
    update: {
      name: "Primary Healthcare System Development Project",
      nameLocal:
        "โครงการพัฒนาระบบการแพทย์ปฐมภูมิ และเครือข่ายระบบสุขภาพระดับอำเภอ",
      description:
        "Development of primary healthcare system and district health network",
      planId: plan1.id,
      isActive: true,
    },
    create: {
      code: "OUT-001",
      name: "Primary Healthcare System Development Project",
      nameLocal:
        "โครงการพัฒนาระบบการแพทย์ปฐมภูมิ และเครือข่ายระบบสุขภาพระดับอำเภอ",
      description:
        "Development of primary healthcare system and district health network",
      planId: plan1.id,
      isActive: true,
    },
  });

  const output2 = await prisma.output.upsert({
    where: { code: "OUT-002" },
    update: {
      name: "Quality Health Management Policy and Strategy Output",
      nameLocal:
        "ผลผลิตนโยบาย ยุทธศาสตร์ ระบบบริหารจัดการด้านสุขภาพที่มีคุณภาพและประสิทธิภาพ",
      description:
        "Quality and efficient health management policy and strategy output",
      planId: plan2.id,
      isActive: true,
    },
    create: {
      code: "OUT-002",
      name: "Quality Health Management Policy and Strategy Output",
      nameLocal:
        "ผลผลิตนโยบาย ยุทธศาสตร์ ระบบบริหารจัดการด้านสุขภาพที่มีคุณภาพและประสิทธิภาพ",
      description:
        "Quality and efficient health management policy and strategy output",
      planId: plan2.id,
      isActive: true,
    },
  });

  console.log("Upserted outputs");

  // Create or update activities
  const activity1 = await prisma.activity.upsert({
    where: { code: "ACT-001" },
    update: {
      name: "Develop Quality Primary Care Services and District Health Board (DHB)",
      nameLocal:
        "พัฒนาระบบบริการปฐมภูมิให้มีคุณภาพมาตรฐานและพัฒนาคุณภาพชีวิตระดับอำเภอ (DHB)",
      description:
        "Develop quality primary care services and improve district-level quality of life",
      outputId: output1.id,
      isActive: true,
    },
    create: {
      code: "ACT-001",
      name: "Develop Quality Primary Care Services and District Health Board (DHB)",
      nameLocal:
        "พัฒนาระบบบริการปฐมภูมิให้มีคุณภาพมาตรฐานและพัฒนาคุณภาพชีวิตระดับอำเภอ (DHB)",
      description:
        "Develop quality primary care services and improve district-level quality of life",
      outputId: output1.id,
      isActive: true,
    },
  });

  const activity2 = await prisma.activity.upsert({
    where: { code: "ACT-002" },
    update: {
      name: "Prepare and Develop Health Policies and Strategies",
      nameLocal: "จัดทำข้อเสนอและพัฒนานโยบายและยุทธศาสตร์ด้านสุขภาพ",
      description:
        "Prepare proposals and develop health policies and strategies",
      outputId: output2.id,
      isActive: true,
    },
    create: {
      code: "ACT-002",
      name: "Prepare and Develop Health Policies and Strategies",
      nameLocal: "จัดทำข้อเสนอและพัฒนานโยบายและยุทธศาสตร์ด้านสุขภาพ",
      description:
        "Prepare proposals and develop health policies and strategies",
      outputId: output2.id,
      isActive: true,
    },
  });

  console.log("Upserted activities");

  // Create or update users with hashed passwords
  const hashedPassword = await bcrypt.hash("password123", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@phc.go.th" },
    update: {
      password: hashedPassword,
      name: "System Administrator",
      nameLocal: "ผู้ดูแลระบบ",
      role: UserRole.SUPER_ADMIN,
      divisionId: mainDept.id,
      isActive: true,
    },
    create: {
      email: "admin@phc.go.th",
      password: hashedPassword,
      name: "System Administrator",
      nameLocal: "ผู้ดูแลระบบ",
      role: UserRole.SUPER_ADMIN,
      divisionId: mainDept.id,
      isActive: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "dept.admin@phc.go.th" },
    update: {
      password: hashedPassword,
      name: "Department Admin",
      nameLocal: "ผู้ดูแลแผนก",
      role: UserRole.ADMIN,
      divisionId: mainDept.id,
      isActive: true,
    },
    create: {
      email: "dept.admin@phc.go.th",
      password: hashedPassword,
      name: "Department Admin",
      nameLocal: "ผู้ดูแลแผนก",
      role: UserRole.ADMIN,
      divisionId: mainDept.id,
      isActive: true,
    },
  });

  const approver = await prisma.user.upsert({
    where: { email: "approver@phc.go.th" },
    update: {
      password: hashedPassword,
      name: "Budget Approver",
      nameLocal: "ผู้อนุมัติงบประมาณ",
      role: UserRole.APPROVER,
      divisionId: mainDept.id,
      isActive: true,
    },
    create: {
      email: "approver@phc.go.th",
      password: hashedPassword,
      name: "Budget Approver",
      nameLocal: "ผู้อนุมัติงบประมาณ",
      role: UserRole.APPROVER,
      divisionId: mainDept.id,
      isActive: true,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@phc.go.th" },
    update: {
      password: hashedPassword,
      name: "Staff Member",
      nameLocal: "เจ้าหน้าที่",
      role: UserRole.STAFF,
      divisionId: mainDept.id,
      isActive: true,
    },
    create: {
      email: "staff@phc.go.th",
      password: hashedPassword,
      name: "Staff Member",
      nameLocal: "เจ้าหน้าที่",
      role: UserRole.STAFF,
      divisionId: mainDept.id,
      isActive: true,
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "viewer@phc.go.th" },
    update: {
      password: hashedPassword,
      name: "Report Viewer",
      nameLocal: "ผู้ดูรายงาน",
      role: UserRole.VIEWER,
      divisionId: mainDept.id,
      isActive: true,
    },
    create: {
      email: "viewer@phc.go.th",
      password: hashedPassword,
      name: "Report Viewer",
      nameLocal: "ผู้ดูรายงาน",
      role: UserRole.VIEWER,
      divisionId: mainDept.id,
      isActive: true,
    },
  });

  console.log("Upserted users");

  // Create or update sample budget
  const budget = await prisma.budget.upsert({
    where: { code: "BUD-2025-001" },
    update: {
      name: "FY2025 Health Promotion Budget",
      nameLocal: "งบประมาณส่งเสริมสุขภาพ ปี 2568",
      description: "Annual budget for health promotion activities",
      descriptionLocal: "งบประมาณประจำปีสำหรับกิจกรรมส่งเสริมสุขภาพ",
      fiscalYear: 2025,
      divisionId: mainDept.id,
      categoryId: category2.id,
      planId: plan1.id,
      outputId: output1.id,
      activityId: activity1.id,
      allocatedAmount: 5000000, // 5 million baht
      startDate: new Date("2024-10-01"),
      endDate: new Date("2025-09-30"),
      createdById: admin.id,
    },
    create: {
      code: "BUD-2025-001",
      name: "FY2025 Health Promotion Budget",
      nameLocal: "งบประมาณส่งเสริมสุขภาพ ปี 2568",
      description: "Annual budget for health promotion activities",
      descriptionLocal: "งบประมาณประจำปีสำหรับกิจกรรมส่งเสริมสุขภาพ",
      fiscalYear: 2025,
      divisionId: mainDept.id,
      categoryId: category2.id,
      planId: plan1.id,
      outputId: output1.id,
      activityId: activity1.id,
      allocatedAmount: 5000000, // 5 million baht
      startDate: new Date("2024-10-01"),
      endDate: new Date("2025-09-30"),
      createdById: admin.id,
    },
  });

  console.log("Upserted sample budget");

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
