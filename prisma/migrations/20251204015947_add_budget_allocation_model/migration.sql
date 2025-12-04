-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "budgetAllocationId" TEXT;

-- CreateTable
CREATE TABLE "BudgetAllocation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLocal" TEXT NOT NULL,
    "description" TEXT,
    "descriptionLocal" TEXT,
    "budgetId" TEXT NOT NULL,
    "allocatedAmount" DECIMAL(15,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAllocation_code_key" ON "BudgetAllocation"("code");

-- CreateIndex
CREATE INDEX "BudgetAllocation_code_idx" ON "BudgetAllocation"("code");

-- CreateIndex
CREATE INDEX "BudgetAllocation_budgetId_idx" ON "BudgetAllocation"("budgetId");

-- CreateIndex
CREATE INDEX "BudgetAllocation_createdById_idx" ON "BudgetAllocation"("createdById");

-- CreateIndex
CREATE INDEX "BudgetAllocation_status_idx" ON "BudgetAllocation"("status");

-- CreateIndex
CREATE INDEX "Expense_budgetAllocationId_idx" ON "Expense"("budgetAllocationId");

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_budgetAllocationId_fkey" FOREIGN KEY ("budgetAllocationId") REFERENCES "BudgetAllocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
