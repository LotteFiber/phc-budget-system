import { getTranslations } from "next-intl/server";
import { getBudgetStatistics } from "@/actions/budget";
import { getPendingApprovalCount } from "@/actions/approval";
import { getExpenses } from "@/actions/expense";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Fetch data
  const currentYear = new Date().getFullYear();
  const statsResult = await getBudgetStatistics(currentYear);
  const approvalCountResult = await getPendingApprovalCount();
  const recentExpensesResult = await getExpenses({});

  const stats = statsResult.success ? statsResult.data : null;
  const approvalCount = approvalCountResult.success
    ? approvalCountResult.data?.count || 0
    : 0;
  const recentExpenses = recentExpensesResult.success
    ? recentExpensesResult.data?.slice(0, 5) || []
    : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("dashboard.title")}
        </h1>
        <p className="text-muted-foreground">{t("dashboard.overview")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("dashboard.totalBudget")}
            </p>
            <p className="text-2xl font-bold">
              {stats ? formatCurrency(stats.totalBudget) : "฿0.00"}
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("dashboard.totalSpent")}
            </p>
            <p className="text-2xl font-bold">
              {stats ? formatCurrency(stats.totalSpent) : "฿0.00"}
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("dashboard.remaining")}
            </p>
            <p className="text-2xl font-bold">
              {stats ? formatCurrency(stats.remaining) : "฿0.00"}
            </p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("dashboard.pendingApprovals")}
            </p>
            <p className="text-2xl font-bold">{approvalCount}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">
          {t("dashboard.recentActivity")}
        </h2>
        {recentExpenses.length > 0 ? (
          <div className="space-y-4">
            {recentExpenses.map((expense) => (
              <Link
                key={expense.id}
                href={`/${locale}/dashboard/expenses/${expense.id}`}
                className="block hover:bg-accent/50 rounded-lg p-3 -m-3 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{expense.title}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          expense.status === "APPROVED"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : expense.status === "PENDING_APPROVAL"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : expense.status === "REJECTED"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {expense.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {expense.division.nameLocal} • {expense.code}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCurrency(Number(expense.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.expenseDate).toLocaleDateString(
                        "th-TH"
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No recent activity</p>
        )}
      </div>
    </div>
  );
}
