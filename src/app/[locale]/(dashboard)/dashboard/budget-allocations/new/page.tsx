import { getTranslations } from "next-intl/server";
import { getBudgets } from "@/actions/budget";
import { getDivisions } from "@/actions/helpers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BudgetAllocationForm from "@/components/forms/budget-allocation-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NewBudgetAllocationPage({ params }: Props) {
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

  // Fetch budgets and divisions
  const budgetsResult = await getBudgets({});
  const divisionsResult = await getDivisions();

  const budgets = budgetsResult.success ? budgetsResult.data || [] : [];
  const divisions = divisionsResult.success ? divisionsResult.data || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("budgetAllocation.createNew")}
        </h1>
        <p className="text-muted-foreground">
          {t("budgetAllocation.createDescription")}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <BudgetAllocationForm
          budgets={budgets}
          divisions={divisions}
          locale={locale}
        />
      </div>
    </div>
  );
}
