import { getTranslations } from "next-intl/server";
import { getBudgetCategories, getPlans, getOutputs, getActivities } from "@/actions/helpers";
import BudgetForm from "@/components/forms/budget-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NewBudgetPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Fetch required data
  const categoriesResult = await getBudgetCategories();
  const plansResult = await getPlans();
  const outputsResult = await getOutputs();
  const activitiesResult = await getActivities();

  const categories = categoriesResult.success ? categoriesResult.data || [] : [];
  const plans = plansResult.success ? plansResult.data || [] : [];
  const outputs = outputsResult.success ? outputsResult.data || [] : [];
  const activities = activitiesResult.success ? activitiesResult.data || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("budget.createNew")}</h1>
        <p className="text-muted-foreground">{t("budget.createDescription")}</p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <BudgetForm
          categories={categories}
          plans={plans}
          outputs={outputs}
          activities={activities}
          locale={locale}
        />
      </div>
    </div>
  );
}
