import { getTranslations } from "next-intl/server";
import { getBudgetAllocations } from "@/actions/budget-allocation";
import {
  getDivisions,
  getBudgetCategories,
  getOutputs,
} from "@/actions/helpers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AllocationFilters from "@/components/allocations/allocation-filters";
import DisbursementModal from "@/components/allocations/disbursement-modal";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BudgetAllocationsPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const searchParamsResolved = await searchParams;
  const divisionId = searchParamsResolved.divisionId as string | undefined;
  const outputId = searchParamsResolved.outputId as string | undefined;
  const projectId = searchParamsResolved.projectId as string | undefined;
  const categoryId = searchParamsResolved.categoryId as string | undefined;

  // Fetch filter data
  const divisionsResult = await getDivisions();
  const outputsResult = await getOutputs();
  const categoriesResult = await getBudgetCategories();

  const divisions = divisionsResult.success ? divisionsResult.data || [] : [];
  const outputs = outputsResult.success ? outputsResult.data || [] : [];
  const categories = categoriesResult.success
    ? categoriesResult.data || []
    : [];

  // Fetch budget allocations
  const allocationsResult = await getBudgetAllocations({});
  const allAllocations = allocationsResult.success
    ? allocationsResult.data || []
    : [];

  // Prepare allocations for client component (only id and nameLocal)
  const allocationsForFilter = allAllocations.map((a) => ({
    id: a.id,
    nameLocal: a.nameLocal,
  }));

  // Serialize allocations for DisbursementModal (convert Decimal to number)
  const serializedAllocations = allAllocations.map((a) => ({
    id: a.id,
    nameLocal: a.nameLocal,
    remainingAmount: a.remainingAmount,
    budget: {
      id: a.budget.id,
      categoryId: a.budget.categoryId,
      divisionId: a.budget.divisionId,
      division: {
        nameLocal: a.budget.division.nameLocal,
      },
    },
  }));

  // Filter allocations based on search params
  const allocations = allAllocations.filter((allocation) => {
    if (
      divisionId &&
      divisionId !== "all" &&
      allocation.budget.divisionId !== divisionId
    )
      return false;
    if (
      outputId &&
      outputId !== "all" &&
      allocation.budget.outputId !== outputId
    )
      return false;
    if (projectId && projectId !== "all" && allocation.id !== projectId)
      return false;
    if (
      categoryId &&
      categoryId !== "all" &&
      allocation.budget.categoryId !== categoryId
    )
      return false;
    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate totals
  const totalBudget = allocations.reduce(
    (sum, a) => sum + Number(a.allocatedAmount),
    0
  );
  const totalSpent = allocations.reduce((sum, a) => sum + a.spentAmount, 0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("budget.allocation.pageTitle")}
        </h1>
      </div>

      {/* Filters Section */}
      <div className="rounded-lg border bg-card p-6">
        <AllocationFilters
          divisions={divisions}
          outputs={outputs}
          categories={categories}
          allocations={allocationsForFilter}
          locale={locale}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Link href={`/${locale}/dashboard/allocations/new`}>
            <Button size="lg" className="min-w-[180px]">
              {t("budget.allocation.addProject")}
            </Button>
          </Link>
          <DisbursementModal allocations={serializedAllocations} />
        </div>
      </div>

      {/* Summary Table */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-center">
            {t("budget.allocation.summaryTableTitle")}
          </h2>
        </div>

        {allocations.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    {t("budget.allocation.code")}
                  </TableHead>
                  <TableHead>{t("budget.allocation.projectName")}</TableHead>
                  <TableHead>{t("budget.outputProject")}</TableHead>
                  <TableHead>{t("budget.expenditureCategory")}</TableHead>
                  <TableHead className="text-right">
                    {t("budget.allocation.budgetAmount")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("budget.allocation.disbursed")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("budget.allocation.balance")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((allocation) => (
                  <TableRow key={allocation.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-sm">
                      {allocation.code}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{allocation.nameLocal}</p>
                        <p className="text-xs text-muted-foreground">
                          {allocation.budget.division.nameLocal}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {allocation.budget.output.nameLocal}
                    </TableCell>
                    <TableCell className="text-sm">
                      {allocation.budget.category.nameLocal}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(allocation.allocatedAmount))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(allocation.spentAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          allocation.remainingAmount < 0
                            ? "text-red-600 dark:text-red-400 font-semibold"
                            : "font-medium"
                        }
                      >
                        {formatCurrency(allocation.remainingAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Link
                        href={`/${locale}/dashboard/allocations/${allocation.id}`}
                      >
                        <Button variant="ghost" size="sm">
                          {t("budget.allocation.viewDetails")}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Total Row */}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={4} className="text-right">
                    {t("budget.allocation.total")}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totalBudget)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totalSpent)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        totalRemaining < 0
                          ? "text-red-600 dark:text-red-400"
                          : ""
                      }
                    >
                      {formatCurrency(totalRemaining)}
                    </span>
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-muted-foreground mb-4">
              {t("budget.allocation.noProjects")}
            </p>
            <Link href={`/${locale}/dashboard/allocations/new`}>
              <Button>{t("budget.allocation.addNewProject")}</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
