import { getTranslations } from "next-intl/server";
import { getBudgets } from "@/actions/budget";
import { auth } from "@/lib/auth";
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
import BudgetActions from "@/components/budgets/budget-actions";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BudgetsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const session = await auth();

  const searchParamsResolved = await searchParams;
  const divisionId = searchParamsResolved.divisionId as string | undefined;
  const fiscalYear = searchParamsResolved.fiscalYear
    ? parseInt(searchParamsResolved.fiscalYear as string)
    : undefined;

  // Fetch data
  const budgetsResult = await getBudgets({ divisionId, fiscalYear });
  const budgets = budgetsResult.success ? budgetsResult.data || [] : [];
  const userRole = session?.user?.role || "VIEWER";

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
            {t("budget.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("budget.manageDescription")}
          </p>
        </div>
        <Link href={`/${locale}/dashboard/budgets/new`}>
          <Button>{t("budget.createNew")}</Button>
        </Link>
      </div>

      {budgets.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("budget.code")}</TableHead>
                  <TableHead>{t("budget.name")}</TableHead>
                  <TableHead>{t("budget.division")}</TableHead>
                  <TableHead>{t("budget.fiscalYear")}</TableHead>
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
                {budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell className="font-medium">{budget.code}</TableCell>
                    <TableCell>
                      <p className="font-normal">{budget.name}</p>
                    </TableCell>
                    <TableCell>{budget.division.nameLocal}</TableCell>
                    <TableCell>{budget.fiscalYear}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(Number(budget.allocatedAmount))}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(budget.spentAmount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          budget.remainingAmount < 0
                            ? "text-red-600 dark:text-red-400 font-semibold"
                            : ""
                        }
                      >
                        {formatCurrency(budget.remainingAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <BudgetActions
                        budgetId={budget.id}
                        budgetCode={budget.code}
                        locale={locale}
                        userRole={userRole}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className="rounded-lg border bg-card p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <Link href={`/${locale}/dashboard/budgets/${budget.id}`} className="flex-1">
                    <p className="font-normal hover:text-primary">{budget.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {budget.code}
                    </p>
                  </Link>
                  <BudgetActions
                    budgetId={budget.id}
                    budgetCode={budget.code}
                    locale={locale}
                    userRole={userRole}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">
                      {t("budget.allocated")}
                    </p>
                    <p className="font-semibold">
                      {formatCurrency(Number(budget.allocatedAmount))}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      {t("budget.spent")}
                    </p>
                    <p className="font-semibold">
                      {formatCurrency(budget.spentAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      {t("budget.remaining")}
                    </p>
                    <p
                      className={`font-semibold ${
                        budget.remainingAmount < 0 ? "text-red-600" : ""
                      }`}
                    >
                      {formatCurrency(budget.remainingAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">
                      {t("budget.fiscalYear")}
                    </p>
                    <p className="font-semibold">{budget.fiscalYear}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">{t("budget.noBudgets")}</p>
          <Link href={`/${locale}/dashboard/budgets/new`}>
            <Button>{t("budget.createFirst")}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
