/*
  Warnings:

  - You are about to drop the column `code` on the `Division` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Division` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `Division` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Division" DROP CONSTRAINT "Department_parentId_fkey";

-- DropIndex
DROP INDEX "Department_code_idx";

-- DropIndex
DROP INDEX "Department_code_key";

-- DropIndex
DROP INDEX "Department_parentId_idx";

-- AlterTable
ALTER TABLE "Division" RENAME CONSTRAINT "Department_pkey" TO "Division_pkey";

-- AlterTable
ALTER TABLE "Division" DROP COLUMN "code";

-- AlterTable
ALTER TABLE "Division" DROP COLUMN "name";

-- AlterTable
ALTER TABLE "Division" DROP COLUMN "parentId";

-- AlterTable
ALTER TABLE "Division" ADD COLUMN "descriptionLocal" TEXT;

-- AlterTable
ALTER TABLE "Division" ALTER COLUMN "nameLocal" DROP NOT NULL;

-- RenameForeignKey
ALTER TABLE "Budget" RENAME CONSTRAINT "Budget_departmentId_fkey" TO "Budget_divisionId_fkey";

-- RenameForeignKey
ALTER TABLE "Expense" RENAME CONSTRAINT "Expense_departmentId_fkey" TO "Expense_divisionId_fkey";

-- RenameForeignKey
ALTER TABLE "User" RENAME CONSTRAINT "User_departmentId_fkey" TO "User_divisionId_fkey";
