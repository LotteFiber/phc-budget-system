import { getTranslations } from "next-intl/server";
import { getBudgetById } from "@/actions/budget";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function BudgetDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });

  const result = await getBudgetById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const budget = result.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      ACTIVE: {
        label: "Active",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      COMPLETED: {
        label: "Completed",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      CANCELLED: {
        label: "Cancelled",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      },
    };

    const config = statusMap[status] || statusMap.ACTIVE;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link href={`/${locale}/dashboard/budgets`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {budget.name}
          </h1>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("budget.details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("budget.code")}
                </p>
                <p className="font-medium">{budget.code}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  {t("budget.fiscalYear")}
                </p>
                <p className="font-medium">{budget.fiscalYear}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("budget.division")}
                </p>
                <p className="font-medium">{budget.division.nameLocal}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("budget.category")}
                </p>
                <p className="font-medium">{budget.category.nameLocal}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("budget.plan")}
                </p>
                <p className="font-medium">{budget.plan.nameLocal}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("budget.outputProject")}
                </p>
                <p className="font-medium">{budget.output.nameLocal}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("budget.activity")}
                </p>
                <p className="font-medium">{budget.activity.nameLocal}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("budget.period")}
                </p>
                <p className="font-medium">
                  {new Date(budget.startDate).toLocaleDateString("th-TH")} -{" "}
                  {new Date(budget.endDate).toLocaleDateString("th-TH")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("common.createdBy")}
                </p>
                <p className="font-medium">{budget.createdBy.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("common.createdAt")}
                </p>
                <p className="font-medium">
                  {new Date(budget.createdAt).toLocaleDateString("th-TH")}
                </p>
              </div>
            </div>

            {budget.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("common.description")}
                </p>
                <p className="text-sm">{budget.description}</p>
                {budget.descriptionLocal && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {budget.descriptionLocal}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("budget.allocated")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("budget.allocated")}
              </p>
              <p className="text-3xl font-bold">
                {formatCurrency(Number(budget.allocatedAmount))}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Allocated to Projects
              </p>
              <p className="text-2xl font-semibold">
                {formatCurrency(budget.allocatedToProjects)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t("budget.remaining")}
              </p>
              <p
                className={`text-2xl font-semibold ${
                  budget.remainingAmount < 0 ? "text-red-600 dark:text-red-400" : ""
                }`}
              >
                {formatCurrency(budget.remainingAmount)}
              </p>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm mb-2">
                <span>{t("dashboard.budgetUtilization")}</span>
                <span className="font-medium">
                  {(
                    (budget.allocatedToProjects / Number(budget.allocatedAmount)) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className={`h-2.5 rounded-full ${
                    budget.allocatedToProjects / Number(budget.allocatedAmount) > 0.9
                      ? "bg-red-600"
                      : budget.allocatedToProjects / Number(budget.allocatedAmount) > 0.7
                      ? "bg-yellow-600"
                      : "bg-green-600"
                  }`}
                  style={{
                    width: `${Math.min(
                      (budget.allocatedToProjects / Number(budget.allocatedAmount)) * 100,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("budget.budgetAllocation")}</CardTitle>
        </CardHeader>
        <CardContent>
          {budget.budgetAllocations.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Project Name</TableHead>
                      <TableHead className="text-right">
                        {t("budget.allocatedAmount")}
                      </TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">
                        {t("common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budget.budgetAllocations.map((allocation) => (
                      <TableRow key={allocation.id}>
                        <TableCell className="font-medium">
                          {allocation.code}
                        </TableCell>
                        <TableCell>{allocation.name}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(allocation.allocatedAmount))}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(allocation.status)}
                        </TableCell>
                        <TableCell>
                          {new Date(allocation.startDate).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit" })} - {new Date(allocation.endDate).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit" })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/${locale}/dashboard/projects/${allocation.id}`}>
                            <Button variant="ghost" size="sm">
                              {t("common.view")}
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden space-y-3">
                {budget.budgetAllocations.map((allocation) => (
                  <Link
                    key={allocation.id}
                    href={`/${locale}/dashboard/projects/${allocation.id}`}
                    className="block border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{allocation.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {allocation.code}
                        </p>
                      </div>
                      {getStatusBadge(allocation.status)}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(allocation.startDate).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit" })} - {new Date(allocation.endDate).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit" })}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(Number(allocation.allocatedAmount))}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No budget allocations created yet.
            </p>
          )}
        </CardContent>
      </Card>

      {budget.approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("approval.history")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budget.approvals.map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-start justify-between border-b pb-4"
                >
                  <div>
                    <p className="font-medium">{approval.approver.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Level {approval.level}
                    </p>
                    {approval.comments && (
                      <p className="text-sm mt-1">{approval.comments}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge
                      className={
                        approval.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : approval.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {approval.status}
                    </Badge>
                    {approval.decidedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(approval.decidedAt).toLocaleDateString(
                          "th-TH"
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
