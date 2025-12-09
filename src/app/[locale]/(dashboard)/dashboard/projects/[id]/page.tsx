import { getTranslations } from "next-intl/server";
import { getBudgetAllocationById } from "@/actions/budget-allocation";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Edit, Plus } from "lucide-react";
import DeleteProjectButton from "@/components/projects/delete-project-button";
import ExpenseActions from "@/components/expenses/expense-actions";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function BudgetAllocationDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });
  const session = await auth();

  const result = await getBudgetAllocationById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const allocation = result.data;
  const userRole = session?.user?.role || "VIEWER";
  const canEdit =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    allocation.createdById === session?.user?.id;

  const canDelete = userRole === "SUPER_ADMIN" || userRole === "ADMIN";

  const hasExpenses = allocation.expenses.length > 0;

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

  const getExpenseStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      DRAFT: {
        label: "Draft",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      },
      PENDING_APPROVAL: {
        label: "Pending",
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
      APPROVED: {
        label: "Approved",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      REJECTED: {
        label: "Rejected",
        className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      },
      PAID: {
        label: "Paid",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      CANCELLED: {
        label: "Cancelled",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      },
    };

    const config = statusMap[status] || statusMap.DRAFT;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Calculate spent amount from expenses
  const spentAmount = allocation.expenses
    .filter((exp) => exp.status !== "REJECTED" && exp.status !== "CANCELLED")
    .reduce((sum, exp) => sum + Number(exp.amount), 0);

  const remainingAmount = Number(allocation.allocatedAmount) - spentAmount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href={`/${locale}/dashboard/projects`}>
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {allocation.nameLocal}
          </h1>
          {allocation.name !== allocation.nameLocal && (
            <p className="text-muted-foreground">{allocation.name}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {canEdit && allocation.status === "ACTIVE" && (
            <Link href={`/${locale}/dashboard/projects/${id}/edit`}>
              <Button size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                {t("common.edit")}
              </Button>
            </Link>
          )}
          {canDelete && (
            <DeleteProjectButton
              id={id}
              locale={locale}
              hasExpenses={hasExpenses}
            />
          )}
        </div>
      </div>

      {/* Budget Allocation Details */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("budget.allocation.allocationDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Code</p>
                <p className="font-medium">{allocation.code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("common.status")}
                </p>
                {getStatusBadge(allocation.status)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("budget.allocatedAmount")}
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(Number(allocation.allocatedAmount))}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("budget.spentAmount")}
                </p>
                <p className="font-medium">{formatCurrency(spentAmount)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("budget.remainingAmount")}
                </p>
                <p
                  className={`font-medium ${
                    remainingAmount < 0 ? "text-red-600 dark:text-red-400" : ""
                  }`}
                >
                  {formatCurrency(remainingAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="font-medium">
                  {new Date(allocation.startDate).toLocaleDateString("th-TH")} -{" "}
                  {new Date(allocation.endDate).toLocaleDateString("th-TH")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("common.createdBy")}
                </p>
                <p className="font-medium">{allocation.createdBy.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("common.createdAt")}
                </p>
                <p className="font-medium">
                  {new Date(allocation.createdAt).toLocaleDateString("th-TH")}
                </p>
              </div>
            </div>

            {(allocation.description || allocation.descriptionLocal) && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {t("common.description")}
                </p>
                {allocation.descriptionLocal && (
                  <p className="text-sm">{allocation.descriptionLocal}</p>
                )}
                {allocation.description &&
                  allocation.description !== allocation.descriptionLocal && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {allocation.description}
                    </p>
                  )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parent Budget Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t("budget.allocation.parentBudget")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-medium">
                  {allocation.budget.code} - {allocation.budget.nameLocal}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("budget.division")}
                </p>
                <p className="font-medium">
                  {allocation.budget.division.nameLocal}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("budget.fiscalYear")}
                </p>
                <p className="font-medium">{allocation.budget.fiscalYear}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">
                  {t("budget.category")}
                </p>
                <p className="font-medium">
                  {allocation.budget.category.code} -{" "}
                  {allocation.budget.category.nameLocal}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">
                  {t("budget.plan")}
                </p>
                <p className="font-medium">
                  {allocation.budget.plan.code} -{" "}
                  {allocation.budget.plan.nameLocal}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">
                  {t("budget.outputProject")}
                </p>
                <p className="font-medium">
                  {allocation.budget.output.code} -{" "}
                  {allocation.budget.output.nameLocal}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">
                  {t("budget.activity")}
                </p>
                <p className="font-medium">
                  {allocation.budget.activity.code} -{" "}
                  {allocation.budget.activity.nameLocal}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("expense.title")}</CardTitle>
            {allocation.status === "ACTIVE" && (
              <Link href={`/${locale}/dashboard/projects/${id}/expense/new`}>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t("budget.allocation.createExpense")}
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {allocation.expenses.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>{t("expense.category")}</TableHead>
                      <TableHead className="text-right">
                        {t("expense.amount")}
                      </TableHead>
                      <TableHead>{t("expense.date")}</TableHead>
                      <TableHead>{t("common.status")}</TableHead>
                      <TableHead className="text-right">
                        {t("common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocation.expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          {expense.code}
                        </TableCell>
                        <TableCell>{expense.title}</TableCell>
                        <TableCell>{expense.category.nameLocal}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(expense.amount))}
                        </TableCell>
                        <TableCell>
                          {new Date(expense.expenseDate).toLocaleDateString(
                            "th-TH"
                          )}
                        </TableCell>
                        <TableCell>
                          {getExpenseStatusBadge(expense.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <ExpenseActions
                            expense={expense}
                            allocationId={id}
                            locale={locale}
                            canEdit={
                              userRole === "SUPER_ADMIN" ||
                              userRole === "ADMIN" ||
                              (expense.createdById === session?.user?.id &&
                                expense.status !== "APPROVED" &&
                                expense.status !== "PAID")
                            }
                            canDelete={
                              expense.status === "DRAFT" &&
                              (userRole === "SUPER_ADMIN" ||
                                userRole === "ADMIN" ||
                                expense.createdById === session?.user?.id)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {allocation.expenses.map((expense) => (
                  <Link
                    key={expense.id}
                    href={`/${locale}/dashboard/projects/${id}/expense/${expense.id}`}
                    className="block"
                  >
                    <div className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">{expense.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {expense.code}
                          </p>
                        </div>
                        {getExpenseStatusBadge(expense.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">
                            {t("expense.amount")}
                          </p>
                          <p className="font-semibold">
                            {formatCurrency(Number(expense.amount))}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            {t("expense.date")}
                          </p>
                          <p className="font-semibold">
                            {new Date(expense.expenseDate).toLocaleDateString(
                              "th-TH"
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {t("budget.allocation.noExpenses")}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
