import { getTranslations } from "next-intl/server";
import { getDepartments } from "@/actions/department";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Wallet } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DepartmentsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const departmentsResult = await getDepartments();
  const departments = departmentsResult.success ? departmentsResult.data || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("nav.departments")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t("departments.description")}</p>
        </div>
        <Link href={`/${locale}/dashboard/departments/new`}>
          <Button>{t("departments.createNew")}</Button>
        </Link>
      </div>

      {departments.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept: any) => (
            <Card key={dept.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{dept.name}</CardTitle>
                      {dept.nameLocal && (
                        <p className="text-sm text-muted-foreground truncate">{dept.nameLocal}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {dept.code}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dept.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{dept.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{dept._count?.users || 0} {t("departments.members")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wallet className="h-4 w-4" />
                      <span>{dept._count?.budgets || 0} Budgets</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Link href={`/${locale}/dashboard/departments/${dept.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        {t("common.view")}
                      </Button>
                    </Link>
                    <Link href={`/${locale}/dashboard/departments/${dept.id}/edit`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        {t("common.edit")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t("departments.noDepartments")}</p>
            <Button>{t("departments.createFirst")}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
