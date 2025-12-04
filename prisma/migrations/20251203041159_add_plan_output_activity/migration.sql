/*
  Warnings:

  - Added the required column `activityId` to the `Budget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outputId` to the `Budget` table without a default value. This is not possible if the table is not empty.
  - Added the required column `planId` to the `Budget` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLocal" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Output" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLocal" TEXT NOT NULL,
    "description" TEXT,
    "planId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Output_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLocal" TEXT NOT NULL,
    "description" TEXT,
    "outputId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE INDEX "Plan_code_idx" ON "Plan"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Output_code_key" ON "Output"("code");

-- CreateIndex
CREATE INDEX "Output_code_idx" ON "Output"("code");

-- CreateIndex
CREATE INDEX "Output_planId_idx" ON "Output"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_code_key" ON "Activity"("code");

-- CreateIndex
CREATE INDEX "Activity_code_idx" ON "Activity"("code");

-- CreateIndex
CREATE INDEX "Activity_outputId_idx" ON "Activity"("outputId");

-- Insert temporary Plan data
INSERT INTO "Plan" ("id", "code", "name", "nameLocal", "createdAt", "updatedAt")
VALUES ('temp_plan_1', 'PLAN-001', 'Strategic Plan for Health Promotion', 'แผนงานยุทธศาสตร์เสริมสร้างให้คนมีสุขภาวะที่ดี', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert temporary Output data
INSERT INTO "Output" ("id", "code", "name", "nameLocal", "planId", "createdAt", "updatedAt")
VALUES ('temp_output_1', 'OUT-001', 'Primary Healthcare System Development Project', 'โครงการพัฒนาระบบการแพทย์ปฐมภูมิ และเครือข่ายระบบสุขภาพระดับอำเภอ', 'temp_plan_1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert temporary Activity data
INSERT INTO "Activity" ("id", "code", "name", "nameLocal", "outputId", "createdAt", "updatedAt")
VALUES ('temp_activity_1', 'ACT-001', 'Develop quality primary care services', 'พัฒนาระบบบริการปฐมภูมิให้มีคุณภาพมาตรฐานและพัฒนาคุณภาพชีวิตระดับอำเภอ (DHB)', 'temp_output_1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable - Add columns with default values for existing rows
ALTER TABLE "Budget" ADD COLUMN "planId" TEXT;
ALTER TABLE "Budget" ADD COLUMN "outputId" TEXT;
ALTER TABLE "Budget" ADD COLUMN "activityId" TEXT;

-- Update existing Budget rows to use temporary data
UPDATE "Budget" SET "planId" = 'temp_plan_1', "outputId" = 'temp_output_1', "activityId" = 'temp_activity_1' WHERE "planId" IS NULL;

-- Make columns NOT NULL after populating data
ALTER TABLE "Budget" ALTER COLUMN "planId" SET NOT NULL;
ALTER TABLE "Budget" ALTER COLUMN "outputId" SET NOT NULL;
ALTER TABLE "Budget" ALTER COLUMN "activityId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Budget_planId_idx" ON "Budget"("planId");

-- CreateIndex
CREATE INDEX "Budget_outputId_idx" ON "Budget"("outputId");

-- CreateIndex
CREATE INDEX "Budget_activityId_idx" ON "Budget"("activityId");

-- AddForeignKey
ALTER TABLE "Output" ADD CONSTRAINT "Output_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_outputId_fkey" FOREIGN KEY ("outputId") REFERENCES "Output"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_outputId_fkey" FOREIGN KEY ("outputId") REFERENCES "Output"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
