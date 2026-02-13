import { getTranslations } from "next-intl/server";
import { getBudgetAllocationById } from "@/actions/budget-allocation";
import { getBudgets } from "@/actions/budget";
import { getDivisions } from "@/actions/helpers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BudgetAllocationForm from "@/components/forms/budget-allocation-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditBudgetAllocationPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });
  const session = await auth();

  // Only Admin and Super Admin can access this page
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "SUPER_ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  // Fetch budget allocation data
  const result = await getBudgetAllocationById(id);

  if (!result.success || !result.data) {
    redirect(`/${locale}/dashboard/budget-allocations`);
  }

  const allocation = result.data;

  // Fetch budgets and divisions
  const budgetsResult = await getBudgets({});
  const divisionsResult = await getDivisions();

  const budgets = budgetsResult.success ? budgetsResult.data || [] : [];
  const divisions = divisionsResult.success ? divisionsResult.data || [] : [];

  // Format initial data for the form
  const initialData = {
    id: allocation.id,
    nameLocal: allocation.name,
    descriptionLocal: allocation.description || undefined,
    budgetId: allocation.budgetId,
    divisionId: allocation.divisionId,
    allocatedAmount: Number(allocation.allocatedAmount),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("budgetAllocation.edit")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Edit budget allocation: {allocation.code}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <BudgetAllocationForm
          budgets={budgets}
          divisions={divisions}
          locale={locale}
          initialData={initialData}
        />
      </div>
    </div>
  );
}
