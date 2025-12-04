import { getTranslations } from "next-intl/server";
import { getUserById } from "@/actions/user";
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
import { ArrowLeft, Edit, Users, Wallet, FileText, Bell } from "lucide-react";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function UserDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });
  const session = await auth();

  const result = await getUserById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const user = result.data;
  const userRole = session?.user?.role || "VIEWER";
  const canEdit =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    session?.user?.id === user.id;

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; className: string }> = {
      SUPER_ADMIN: {
        label: "Super Admin",
        className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      },
      ADMIN: {
        label: "Admin",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      APPROVER: {
        label: "Approver",
        className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      STAFF: {
        label: "Staff",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
      VIEWER: {
        label: "Viewer",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      },
    };

    const config = roleMap[role] || roleMap.VIEWER;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href={`/${locale}/dashboard/users`}>
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {user.name}
            </h1>
            {getRoleBadge(user.role)}
            {!user.isActive && (
              <Badge variant="destructive">Inactive</Badge>
            )}
          </div>
          {user.nameLocal && (
            <p className="text-muted-foreground mt-1">{user.nameLocal}</p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {canEdit && (
            <Link href={`/${locale}/dashboard/users/${id}/edit`}>
              <Button size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                {t("common.edit")}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* User Details & Statistics */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4" />
              {t("budget.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{user._count.createdBudgets}</p>
            <p className="text-xs text-muted-foreground">Created budgets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              {t("expense.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{user._count.createdExpenses}</p>
            <p className="text-xs text-muted-foreground">Created expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{user._count.approvals}</p>
            <p className="text-xs text-muted-foreground">Total approvals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{user._count.notifications}</p>
            <p className="text-xs text-muted-foreground">Total notifications</p>
          </CardContent>
        </Card>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("users.title")} {t("common.details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("users.role")}</p>
              {getRoleBadge(user.role)}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("users.division")}</p>
              <p className="font-medium">{user.division.nameLocal}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("common.status")}</p>
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("common.createdAt")}</p>
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleDateString("th-TH")}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {new Date(user.updatedAt).toLocaleDateString("th-TH")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Budgets */}
      {user.createdBudgets && user.createdBudgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Budgets Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.createdBudgets.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium">{budget.code}</TableCell>
                      <TableCell>{budget.nameLocal}</TableCell>
                      <TableCell>{budget.category.nameLocal}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(budget.allocatedAmount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses */}
      {user.createdExpenses && user.createdExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.createdExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.code}</TableCell>
                      <TableCell>{expense.title}</TableCell>
                      <TableCell>{expense.category.nameLocal}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(expense.amount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
