import { getTranslations } from "next-intl/server";
import { getBudgets } from "@/actions/budget";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import BudgetAllocationForm from "@/components/forms/budget-allocation-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NewBudgetAllocationPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  // Only ADMIN, SUPER_ADMIN, and STAFF can create budget allocations
  if (
    session.user.role !== "SUPER_ADMIN" &&
    session.user.role !== "ADMIN" &&
    session.user.role !== "STAFF"
  ) {
    redirect(`/${locale}/dashboard`);
  }

  // Fetch all budgets with calculated remaining amounts
  const budgetsResult = await getBudgets({});
  const budgets = budgetsResult.success ? budgetsResult.data || [] : [];

  // Filter budgets with remaining amount > 0 and serialize Decimal fields
  const availableBudgets = budgets
    .filter((budget) => budget.remainingAmount > 0)
    .map((budget) => ({
      ...budget,
      allocatedAmount: Number(budget.allocatedAmount),
      remainingAmount: Number(budget.remainingAmount),
    }));

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${locale}/dashboard/allocations`}>
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("budget.allocation.createNew")}
        </h1>
        <p className="text-muted-foreground">
          {t("budget.allocation.createDescription")}
        </p>
      </div>

      {availableBudgets.length > 0 ? (
        <div className="rounded-lg border bg-card p-6">
          <BudgetAllocationForm budgets={availableBudgets} locale={locale} />
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">
            {t("budget.allocation.noBudgetsAvailable")}
          </p>
          <Link href={`/${locale}/dashboard/budgets/new`}>
            <Button>{t("budget.createNew")}</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
