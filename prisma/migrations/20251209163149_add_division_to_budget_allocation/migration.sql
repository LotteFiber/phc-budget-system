/*
  Warnings:

  - Added the required column `divisionId` to the `BudgetAllocation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BudgetAllocation" ADD COLUMN     "divisionId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "BudgetAllocation_divisionId_idx" ON "BudgetAllocation"("divisionId");

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
