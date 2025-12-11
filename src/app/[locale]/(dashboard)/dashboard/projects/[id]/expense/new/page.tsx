import { getTranslations } from "next-intl/server";
import { getBudgetAllocationById } from "@/actions/budget-allocation";
import { getDivisions, getBudgetCategories } from "@/actions/helpers";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import ExpenseForm from "@/components/forms/expense-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function NewExpensePage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check if user can create expenses
  if (session.user.role === "VIEWER") {
    redirect(`/${locale}/dashboard/projects/${id}`);
  }

  // Fetch budget allocation
  const allocationResult = await getBudgetAllocationById(id);
  if (!allocationResult.success || !allocationResult.data) {
    notFound();
  }

  const allocation = allocationResult.data;

  // Check if allocation is active
  if (allocation.status !== "ACTIVE") {
    redirect(`/${locale}/dashboard/projects/${id}`);
  }

  // Fetch required data
  const [divisionsResult, categoriesResult] = await Promise.all([
    getDivisions(),
    getBudgetCategories(),
  ]);

  if (!divisionsResult.success || !categoriesResult.success) {
    throw new Error("Failed to load required data");
  }

  // Prepare budget info with remaining amount
  const spentAmount = allocation.expenses
    .filter((exp) => exp.status !== "REJECTED" && exp.status !== "CANCELLED")
    .reduce((sum, exp) => sum + Number(exp.amount), 0);
  const remainingAmount = Number(allocation.allocatedAmount) - spentAmount;

  const budgetInfo = {
    id: allocation.budget.id,
    code: allocation.budget.code,
    name: allocation.budget.name,
    nameLocal: allocation.budget.nameLocal,
    remainingAmount: remainingAmount,
    categoryId: allocation.budget.categoryId,
    divisionId: allocation.budget.divisionId,
  };

  // Serialize allocation data for client component
  const serializedAllocation = {
    id: allocation.id,
    code: allocation.code,
    name: allocation.name,
    budget: {
      divisionId: allocation.budget.divisionId,
    },
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("budget.allocation.createExpense")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {allocation.name} ({allocation.code})
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("expense.details")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseForm
            categories={categoriesResult.data ?? []}
            budgets={[budgetInfo]}
            locale={locale}
            budgetAllocationId={id}
            budgetAllocation={serializedAllocation}
          />
        </CardContent>
      </Card>
    </div>
  );
}
