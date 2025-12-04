import { getTranslations } from "next-intl/server";
import { getBudgetById } from "@/actions/budget";
import { getBudgetCategories, getPlans, getOutputs, getActivities } from "@/actions/helpers";
import { redirect } from "next/navigation";
import BudgetForm from "@/components/forms/budget-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditBudgetPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });

  // Fetch budget data
  const result = await getBudgetById(id);

  if (!result.success || !result.data) {
    redirect(`/${locale}/dashboard/budgets`);
  }

  const budget = result.data;

  // Fetch required dropdown data
  const categoriesResult = await getBudgetCategories();
  const plansResult = await getPlans();
  const outputsResult = await getOutputs();
  const activitiesResult = await getActivities();

  const categories = categoriesResult.success ? categoriesResult.data || [] : [];
  const plans = plansResult.success ? plansResult.data || [] : [];
  const outputs = outputsResult.success ? outputsResult.data || [] : [];
  const activities = activitiesResult.success ? activitiesResult.data || [] : [];

  // Format initial data for the form
  const initialData = {
    id: budget.id,
    code: budget.code,
    name: budget.name,
    nameLocal: budget.nameLocal,
    description: budget.description || undefined,
    descriptionLocal: budget.descriptionLocal || undefined,
    fiscalYear: budget.fiscalYear,
    divisionId: budget.divisionId,
    categoryId: budget.categoryId,
    planId: budget.planId,
    outputId: budget.outputId,
    activityId: budget.activityId,
    allocatedAmount: Number(budget.allocatedAmount),
    startDate: budget.startDate.toISOString().split('T')[0],
    endDate: budget.endDate.toISOString().split('T')[0],
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("budget.edit")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Edit budget: {budget.code}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <BudgetForm
          categories={categories}
          plans={plans}
          outputs={outputs}
          activities={activities}
          locale={locale}
          initialData={initialData}
        />
      </div>
    </div>
  );
}
