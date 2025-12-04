import { getTranslations } from "next-intl/server";
import {
  getBudgetSummaryReport,
  getExpenseSummaryReport,
  getDepartmentAnalysisReport,
  getApprovalTimelineReport,
} from "@/actions/report";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  Clock,
  CheckCircle,
} from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ReportsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Fetch all reports data
  const [budgetReport, expenseReport, departmentReport, approvalReport] = await Promise.all([
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
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("nav.reports")}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{t("reports.description")}</p>
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
                <CardDescription>{t("reports.budgetSummaryDesc")}</CardDescription>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Fiscal Year: {budgetReport.data.fiscalYear}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Budgets</p>
                <p className="text-2xl font-bold">{budgetReport.data.totals.totalBudgets}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Allocated</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(budgetReport.data.totals.totalAllocated)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(budgetReport.data.totals.totalSpent)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Utilization</p>
                <p className="text-2xl font-bold">
                  {formatNumber(budgetReport.data.totals.averageUtilization, 1)}%
                </p>
              </div>
            </div>

            {budgetReport.data.summary.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Top Budgets by Utilization</h4>
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
                              {formatCurrency(budget.spent)} / {formatCurrency(budget.allocated)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {budget.expenseCount} expenses
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
                <CardDescription>{t("reports.expenseSummaryDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{expenseReport.data.totals.totalExpenses}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(expenseReport.data.totals.totalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(expenseReport.data.totals.approvedAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {formatCurrency(expenseReport.data.totals.pendingAmount)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {/* By Category */}
              <div>
                <h4 className="font-semibold mb-3">By Category</h4>
                <div className="space-y-2">
                  {(expenseReport.data.byCategory as any[])
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5)
                    .map((cat: any) => (
                      <div key={cat.categoryName} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-medium truncate flex-1">{cat.categoryName}</span>
                        <div className="text-right ml-2">
                          <p className="text-sm font-bold">{formatCurrency(cat.total)}</p>
                          <p className="text-xs text-muted-foreground">{cat.count} items</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* By Department */}
              <div>
                <h4 className="font-semibold mb-3">By Department</h4>
                <div className="space-y-2">
                  {(expenseReport.data.byDepartment as any[])
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5)
                    .map((dept: any) => (
                      <div key={dept.departmentName} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-medium truncate flex-1">{dept.departmentName}</span>
                        <div className="text-right ml-2">
                          <p className="text-sm font-bold">{formatCurrency(dept.total)}</p>
                          <p className="text-xs text-muted-foreground">{dept.count} items</p>
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
                <CardDescription>{t("reports.departmentAnalysisDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{departmentReport.data.totals.totalDepartments}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{departmentReport.data.totals.totalUsers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Budgets</p>
                <p className="text-2xl font-bold">{departmentReport.data.totals.totalBudgets}</p>
              </div>
            </div>

            <div className="space-y-2">
              {departmentReport.data.analysis.slice(0, 5).map((dept: any) => (
                <div
                  key={dept.departmentId}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{dept.departmentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {dept.userCount} users • {dept.budgetCount} budgets • {dept.expenseCount} expenses
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(dept.totalSpent)} / {formatCurrency(dept.totalAllocated)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(dept.remaining)} remaining
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

      {/* Approval Timeline Report */}
      {approvalReport.success && approvalReport.data && (
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <CardTitle>{t("reports.approvalTimeline")}</CardTitle>
                <CardDescription>{t("reports.approvalTimelineDesc")}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Total Approvals</p>
                <p className="text-2xl font-bold">{approvalReport.data.statistics.totalApprovals}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {approvalReport.data.statistics.approvedCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {approvalReport.data.statistics.rejectedCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Time</p>
                <p className="text-2xl font-bold">
                  {formatNumber(approvalReport.data.statistics.avgOverallTime, 1)}h
                </p>
              </div>
            </div>

            {/* By Level */}
            <div>
              <h4 className="font-semibold mb-3">Average Time by Level</h4>
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {(approvalReport.data.statistics.byLevel as any[]).map((level: any) => (
                  <div key={level.level} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Level {level.level}</p>
                      <p className="text-xs text-muted-foreground">{level.count} approvals</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatNumber(level.avgDuration, 1)}h</p>
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

      {/* Error state - if no data */}
      {(!budgetReport.success || !expenseReport.success || !departmentReport.success || !approvalReport.success) && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Unable to load some reports. Please try again later.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
