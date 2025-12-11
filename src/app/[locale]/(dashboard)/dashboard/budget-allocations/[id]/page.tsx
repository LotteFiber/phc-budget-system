import { getTranslations } from "next-intl/server";
import { getBudgetAllocationById } from "@/actions/budget-allocation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function BudgetAllocationDetailsPage({ params }: Props) {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  const spentAmount = allocation.expenses
    .filter((exp) => exp.status !== "REJECTED" && exp.status !== "CANCELLED")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const remainingAmount = allocation.allocatedAmount - spentAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/dashboard/budget-allocations`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("budgetAllocation.details")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {allocation.code}
          </p>
        </div>
        <Link href={`/${locale}/dashboard/budget-allocations/${id}/edit`}>
          <Button>{t("common.edit")}</Button>
        </Link>
      </div>

      {/* Budget Allocation Information Card */}
      <div className="rounded-lg border bg-card">
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold">{t("budgetAllocation.details")}</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">{t("budget.code")}</p>
              <p className="font-medium">{allocation.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("budget.allocation.projectNameTh")}</p>
              <p className="font-medium">{allocation.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("expense.budget")}</p>
              <p className="font-medium">{allocation.budget.code} - {allocation.budget.nameLocal}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("budget.division")}</p>
              <p className="font-medium">{allocation.division.nameLocal}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("budget.startDate")}</p>
              <p className="font-medium">{formatDate(allocation.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("budget.endDate")}</p>
              <p className="font-medium">{formatDate(allocation.endDate)}</p>
            </div>
            {allocation.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">{t("common.description")}</p>
                <p className="font-medium">{allocation.description}</p>
              </div>
            )}
          </div>

          {/* Budget Amounts */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">{t("budget.allocation.allocationDetails")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{t("budget.allocated")}</p>
                <p className="text-2xl font-bold">{formatCurrency(allocation.allocatedAmount)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{t("budget.spent")}</p>
                <p className="text-2xl font-bold">{formatCurrency(spentAmount)}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{t("budget.remaining")}</p>
                <p
                  className={`text-2xl font-bold ${
                    remainingAmount < 0 ? "text-red-600 dark:text-red-400" : ""
                  }`}
                >
                  {formatCurrency(remainingAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Created By */}
          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("common.createdBy")}</p>
                <p className="font-medium">{allocation.createdBy.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("common.createdAt")}</p>
                <p className="font-medium">{formatDate(allocation.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
