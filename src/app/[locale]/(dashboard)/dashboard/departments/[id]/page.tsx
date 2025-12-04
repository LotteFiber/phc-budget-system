import { getTranslations } from "next-intl/server";
import { getDepartmentById } from "@/actions/department";
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
import { Building2, Users, Wallet, ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function DepartmentDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });

  const result = await getDepartmentById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const department = result.data;

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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{department.name}</h1>
          {department.nameLocal && <p className="text-muted-foreground">{department.nameLocal}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/${locale}/dashboard/departments/${department.id}/edit`}>
            <Button variant="outline">{t("common.edit")}</Button>
          </Link>
          <Link href={`/${locale}/dashboard/departments`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("common.back")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t("departments.members")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{department._count.users}</p>
            <p className="text-sm text-muted-foreground">{t("departments.members")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {t("budget.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{department._count.budgets}</p>
            <p className="text-sm text-muted-foreground">Total Budgets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t("expense.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{department._count.expenses}</p>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("departments.title")} {t("common.details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("departments.code")}</p>
              <p className="font-medium">{department.code}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("departments.name")}</p>
              <p className="font-medium">{department.name}</p>
            </div>
            {department.nameLocal && (
              <div>
                <p className="text-sm text-muted-foreground">Local Name</p>
                <p className="font-medium">{department.nameLocal}</p>
              </div>
            )}
          </div>

          {department.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t("common.description")}</p>
              <p className="text-sm">{department.description}</p>
              {department.descriptionLocal && (
                <p className="text-sm text-muted-foreground mt-1">{department.descriptionLocal}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users in Department */}
      {department.users && department.users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("departments.members")}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("users.name")}</TableHead>
                    <TableHead>{t("users.email")}</TableHead>
                    <TableHead>{t("users.role")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {department.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {department.users.map((user) => (
                <div key={user.id} className="border rounded-lg p-3">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Budgets */}
      {department.budgets && department.budgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("budget.code")}</TableHead>
                    <TableHead>{t("budget.name")}</TableHead>
                    <TableHead>{t("budget.category")}</TableHead>
                    <TableHead className="text-right">{t("budget.allocated")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {department.budgets.map((budget) => (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium">{budget.code}</TableCell>
                      <TableCell>{budget.name}</TableCell>
                      <TableCell>{budget.category.name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(budget.allocatedAmount))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {department.budgets.map((budget) => (
                <Link
                  key={budget.id}
                  href={`/${locale}/dashboard/budgets/${budget.id}`}
                  className="block border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium">{budget.name}</p>
                      <p className="text-sm text-muted-foreground">{budget.code}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{budget.category.name}</span>
                    <span className="font-semibold">
                      {formatCurrency(Number(budget.allocatedAmount))}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
