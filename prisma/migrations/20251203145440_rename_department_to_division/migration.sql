-- AlterTable: Rename Department table to Division
ALTER TABLE "Department" RENAME TO "Division";

-- AlterTable: Rename departmentId columns to divisionId
ALTER TABLE "User" RENAME COLUMN "departmentId" TO "divisionId";
ALTER TABLE "Budget" RENAME COLUMN "departmentId" TO "divisionId";
ALTER TABLE "Expense" RENAME COLUMN "departmentId" TO "divisionId";

-- AlterTable: Rename department indexes to division
ALTER INDEX "Budget_departmentId_idx" RENAME TO "Budget_divisionId_idx";
ALTER INDEX "Expense_departmentId_idx" RENAME TO "Expense_divisionId_idx";
ALTER INDEX "User_departmentId_idx" RENAME TO "User_divisionId_idx";

-- AlterTable: Drop status column from Budget
ALTER TABLE "Budget" DROP COLUMN "status";

-- DropEnum: Drop BudgetStatus enum
DROP TYPE "BudgetStatus";
