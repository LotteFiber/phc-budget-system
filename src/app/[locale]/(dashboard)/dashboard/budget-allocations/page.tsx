import { getTranslations } from "next-intl/server";
import { getBudgetAllocations } from "@/actions/budget-allocation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
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
import BudgetAllocationActions from "@/components/budget-allocations/budget-allocation-actions";

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
  const session = await auth();

  // Only Admin and Super Admin can access this page
  if (
    session?.user?.role !== "ADMIN" &&
    session?.user?.role !== "SUPER_ADMIN"
  ) {
    redirect(`/${locale}/dashboard`);
  }

  // Fetch budget allocations
  const allocationsResult = await getBudgetAllocations({});
  const allocations = allocationsResult.success
    ? allocationsResult.data || []
    : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("budgetAllocation.pageTitle")}
          </h1>
          <p className="text-muted-foreground">
            {t("budgetAllocation.manageDescription")}
          </p>
        </div>
        <Link href={`/${locale}/dashboard/budget-allocations/new`}>
          <Button>{t("budgetAllocation.createNew")}</Button>
        </Link>
      </div>

      {allocations.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("budget.code")}</TableHead>
                  <TableHead>{t("budget.allocation.projectNameTh")}</TableHead>
                  <TableHead>{t("expense.budget")}</TableHead>
                  <TableHead>{t("budget.division")}</TableHead>
                  <TableHead className="text-right">
                    {t("budget.allocated")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("budget.spent")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("budget.remaining")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((allocation) => (
                  <TableRow key={allocation.id}>
                    <TableCell className="font-medium">
                      {allocation.code}
                    </TableCell>
                    <TableCell>
                      <p className="font-normal">{allocation.name}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{allocation.budget.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {allocation.budget.nameLocal}
                      </p>
                    </TableCell>
                    <TableCell>{allocation.division.nameLocal}</TableCell>
                    <TableCell className="text-right">
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
                            : ""
                        }
                      >
                        {formatCurrency(allocation.remainingAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <BudgetAllocationActions
                        allocationId={allocation.id}
                        allocationCode={allocation.code}
                        locale={locale}
                        userRole={session.user.role}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {allocations.map((allocation) => (
              <div
                key={allocation.id}
                className="rounded-lg border bg-card p-4"
              >
                <div className="flex items-start justify-between">
                  <Link
                    href={`/${locale}/dashboard/budget-allocations/${allocation.id}`}
                    className="flex-1"
                  >
                    <p className="font-normal hover:text-primary">
                      {allocation.name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {allocation.code}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {allocation.budget.code} → {allocation.division.nameLocal}
                    </p>
                  </Link>
                  <BudgetAllocationActions
                    allocationId={allocation.id}
                    allocationCode={allocation.code}
                    locale={locale}
                    userRole={session.user.role}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                  <div>
                    <p className="text-muted-foreground">
                      {t("budget.allocated")}
                    </p>
                    <p className="font-semibold">
                      {formatCurrency(Number(allocation.allocatedAmount))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t("budget.spent")}</p>
                    <p className="font-semibold">
                      {formatCurrency(allocation.spentAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      {t("budget.remaining")}
                    </p>
                    <p
                      className={`font-semibold ${
                        allocation.remainingAmount < 0 ? "text-red-600" : ""
                      }`}
                    >
                      {formatCurrency(allocation.remainingAmount)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {t("budget.allocation.noProjects")}
          </p>
          <Link href={`/${locale}/dashboard/budget-allocations/new`}>
            <Button>{t("budgetAllocation.createFirst")}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
