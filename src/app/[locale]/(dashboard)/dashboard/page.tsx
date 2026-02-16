import { getTranslations } from "next-intl/server";
import {
  getBudgetSummaryReport,
  getExpenseSummaryReport,
  getDepartmentAnalysisReport,
  getApprovalTimelineReport,
} from "@/actions/report";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  FileText,
  DollarSign,
  Calendar,
  Building2,
} from "lucide-react";
import {
  BudgetSummaryChart,
  ExpenseSummaryChart,
  DepartmentAnalysisChart,
} from "@/components/charts/dashboard-charts";

type Props = {
  params: Promise<{ locale: string }>;
};

type CategoryData = {
  categoryName: string;
  total: number;
  count: number;
};

type DepartmentData = {
  departmentName: string;
  total: number;
  count: number;
};

type DepartmentAnalysis = {
  divisionId: string;
  departmentName: string;
  userCount: number;
  budgetCount: number;
  expenseCount: number;
  activeBudgets: number;
  totalAllocated: number;
  totalSpent: number;
  remaining: number;
  utilizationRate: number;
  averageBudgetSize: number;
};

type ApprovalLevel = {
  level: number;
  count: number;
  avgDuration: number;
};

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Fetch all reports data
  const [budgetReport, expenseReport, departmentReport, approvalReport] =
    await Promise.all([
      getBudgetSummaryReport(),
      getExpenseSummaryReport(),
      getDepartmentAnalysisReport(),
      getApprovalTimelineReport(),
    ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number, decimals: number = 0) => {
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("nav.reports")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("reports.description")}
        </p>
      </div>

      {/* Budget Summary Report */}
      {budgetReport.success && budgetReport.data && (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <CardTitle>{t("reports.budgetSummary")}</CardTitle>
                <CardDescription>
                  {t("reports.budgetSummaryDesc")}
                </CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {t("reports.fiscalYear")}: {budgetReport.data.fiscalYear}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.totalBudget")}
                </p>
                <p className="text-2xl font-bold">
                  {budgetReport.data.totals.totalBudgets}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.totalAllocated")}
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(budgetReport.data.totals.totalAllocated)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.totalSpent")}
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(budgetReport.data.totals.totalSpent)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.avgUtilization")}
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(budgetReport.data.totals.averageUtilization, 1)}
                  %
                </p>
              </div>
            </div>

            {/* Budget Summary Chart */}
            <div className="mt-6">
              <h4 className="font-semibold mb-3">
                {t("reports.budgetAllocationOverview")}
              </h4>
              <BudgetSummaryChart data={budgetReport.data.totals} />
            </div>

            {budgetReport.data.summary.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">
                  {t("reports.topBudgetsByUtilization")}
                </h4>
                <div className="space-y-2">
                  {budgetReport.data.summary
                    .sort((a, b) => b.utilizationRate - a.utilizationRate)
                    .slice(0, 5)
                    .map((budget) => (
                      <div
                        key={budget.budgetId}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{budget.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {budget.department} • {budget.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatCurrency(budget.spent)} /{" "}
                              {formatCurrency(budget.allocated)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {budget.expenseCount} {t("reports.expenses")}
                            </p>
                          </div>
                          <Badge
                            className={
                              budget.utilizationRate > 90
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                : budget.utilizationRate > 70
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            }
                          >
                            {formatNumber(budget.utilizationRate, 1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Expense Summary Report */}
      {expenseReport.success && expenseReport.data && (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <CardTitle>{t("reports.expenseSummary")}</CardTitle>
                <CardDescription>
                  {t("reports.expenseSummaryDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.totalExpenses")}
                </p>
                <p className="text-2xl font-bold">
                  {expenseReport.data.totals.totalExpenses}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.totalAmount")}
                </p>
                <p className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(expenseReport.data.totals.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.approved")}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(expenseReport.data.totals.approvedAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.pending")}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {formatCurrency(expenseReport.data.totals.pendingAmount)}
                </p>
              </div>
            </div>

            {/* Expense Summary Chart */}
            <div className="mt-6 mb-6">
              <h4 className="font-semibold mb-3">
                {t("reports.expensesByCategory")}
              </h4>
              <ExpenseSummaryChart byCategory={expenseReport.data.byCategory} />
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {/* By Category */}
              <div>
                <h4 className="font-semibold mb-3">
                  {t("reports.byCategory")}
                </h4>
                <div className="space-y-2">
                  {(expenseReport.data.byCategory as CategoryData[])
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5)
                    .map((cat) => (
                      <div
                        key={cat.categoryName}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm font-medium truncate flex-1">
                          {cat.categoryName}
                        </span>
                        <div className="text-right ml-2">
                          <p className="text-sm font-bold">
                            {formatCurrency(cat.total)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cat.count} {t("reports.items")}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* By Department */}
              <div>
                <h4 className="font-semibold mb-3">
                  {t("reports.byDepartment")}
                </h4>
                <div className="space-y-2">
                  {(expenseReport.data.byDepartment as DepartmentData[])
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5)
                    .map((dept) => (
                      <div
                        key={dept.departmentName}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm font-medium truncate flex-1">
                          {dept.departmentName}
                        </span>
                        <div className="text-right ml-2">
                          <p className="text-sm font-bold">
                            {formatCurrency(dept.total)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dept.count} {t("reports.items")}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Department Analysis Report */}
      {departmentReport.success && departmentReport.data && (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <CardTitle>{t("reports.departmentAnalysis")}</CardTitle>
                <CardDescription>
                  {t("reports.departmentAnalysisDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.departments")}
                </p>
                <p className="text-2xl font-bold">
                  {departmentReport.data.totals.totalDepartments}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.totalUsers")}
                </p>
                <p className="text-2xl font-bold">
                  {departmentReport.data.totals.totalUsers}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.totalBudgets")}
                </p>
                <p className="text-2xl font-bold">
                  {departmentReport.data.totals.totalBudgets}
                </p>
              </div>
            </div>

            {/* Department Analysis Chart */}
            <div className="mt-6 mb-6">
              <h4 className="font-semibold mb-3">
                {t("reports.departmentUtilization")}
              </h4>
              <DepartmentAnalysisChart
                analysis={departmentReport.data.analysis}
              />
            </div>

            <div className="space-y-2">
              {departmentReport.data.analysis
                .slice(0, 5)
                .map((dept: DepartmentAnalysis) => (
                  <div
                    key={dept.divisionId}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {dept.departmentName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {dept.userCount} {t("reports.users")} •{" "}
                        {dept.budgetCount} {t("reports.budgets")} •{" "}
                        {dept.expenseCount} {t("reports.expenses")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(dept.totalSpent)} /{" "}
                          {formatCurrency(dept.totalAllocated)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(dept.remaining)}{" "}
                          {t("reports.remaining")}
                        </p>
                      </div>
                      <Badge
                        className={
                          dept.utilizationRate > 90
                            ? "bg-red-100 text-red-800"
                            : dept.utilizationRate > 70
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }
                      >
                        {formatNumber(dept.utilizationRate, 1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Timeline Report
      {approvalReport.success && approvalReport.data && (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <CardTitle>{t("reports.approvalTimeline")}</CardTitle>
                <CardDescription>
                  {t("reports.approvalTimelineDesc")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.totalApprovals")}
                </p>
                <p className="text-2xl font-bold">
                  {approvalReport.data.statistics.totalApprovals}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.approved")}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {approvalReport.data.statistics.approvedCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.rejected")}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {approvalReport.data.statistics.rejectedCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("reports.avgTime")}
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(
                    approvalReport.data.statistics.avgOverallTime,
                    1,
                  )}
                  h
                </p>
              </div>
            </div>

            Approval Timeline Chart
            <div className="mt-6 mb-6">
              <h4 className="font-semibold mb-3">
                {t("reports.approvalDurationTrends")}
              </h4>
              <ApprovalTimelineChart
                byLevel={approvalReport.data.statistics.byLevel}
              />
            </div>

            By Level
            <div>
              <h4 className="font-semibold mb-3">
                {t("reports.avgTimeByLevel")}
              </h4>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {(
                  approvalReport.data.statistics.byLevel as ApprovalLevel[]
                ).map((level) => (
                  <div
                    key={level.level}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {t("reports.level")} {level.level}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {level.count} approvals
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatNumber(level.avgDuration, 1)}h
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(level.avgDuration / 24, 1)}d
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      */}

      {/* Error state - if no data */}
      {(!budgetReport.success ||
        !expenseReport.success ||
        !departmentReport.success ||
        !approvalReport.success) && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Unable to load some reports. Please try again later.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
