import { getTranslations } from "next-intl/server";
import { getBudgetAllocationById } from "@/actions/budget-allocation";
import { getBudgets } from "@/actions/budget";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ProjectForm from "@/components/forms/project-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditBudgetAllocationPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  // Fetch the budget allocation
  const allocationResult = await getBudgetAllocationById(id);
  if (!allocationResult.success || !allocationResult.data) {
    notFound();
  }

  const allocation = allocationResult.data;

  // Check permissions
  const canEdit =
    session.user.role === "SUPER_ADMIN" ||
    session.user.role === "ADMIN" ||
    allocation.createdById === session.user.id;

  if (!canEdit) {
    redirect(`/${locale}/dashboard/projects/${id}`);
  }

  // Fetch all budgets for the dropdown
  const budgetsResult = await getBudgets({});
  const budgets = budgetsResult.success ? budgetsResult.data || [] : [];

  // Filter to include current budget and budgets with remaining amount > 0
  const availableBudgets = budgets.filter(
    (budget) =>
      budget.id === allocation.budgetId || budget.remainingAmount > 0
  );

  // Format initial data for the form
  const initialData = {
    id: allocation.id,
    name: allocation.name,
    nameLocal: allocation.name,
    description: allocation.description || undefined,
    description: allocation.description || undefined,
    budgetId: allocation.budgetId,
    allocatedAmount: Number(allocation.allocatedAmount),
    startDate: new Date(allocation.startDate).toISOString().split("T")[0],
    endDate: new Date(allocation.endDate).toISOString().split("T")[0],
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/${locale}/dashboard/projects/${id}`}>
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("budget.allocation.edit")}
        </h1>
        <p className="text-muted-foreground">
          {t("budget.allocation.editDescription")}
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <ProjectForm
          budgets={availableBudgets}
          initialData={initialData}
          locale={locale}
        />
      </div>
    </div>
  );
}
