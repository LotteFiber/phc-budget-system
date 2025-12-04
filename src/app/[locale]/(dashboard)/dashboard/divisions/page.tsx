import { getTranslations } from "next-intl/server";
import { getDivisions } from "@/actions/division";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Wallet } from "lucide-react";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DivisionsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const divisionsResult = await getDivisions();
  const divisions = divisionsResult.success ? divisionsResult.data || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t("nav.divisions")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("divisions.description")}
          </p>
        </div>
        <Link href={`/${locale}/dashboard/divisions/new`}>
          <Button>{t("divisions.createNew")}</Button>
        </Link>
      </div>

      {divisions.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {divisions.map((div) => (
            <Card key={div.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {div.name}
                      </CardTitle>
                      {div.nameLocal && (
                        <p className="text-sm text-muted-foreground truncate">
                          {div.nameLocal}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {div.code}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {div.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {div.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>
                        {div._count?.users || 0} {t("divisions.members")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Wallet className="h-4 w-4" />
                      <span>{div._count?.budgets || 0} Budgets</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Link
                      href={`/${locale}/dashboard/divisions/${div.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        {t("common.view")}
                      </Button>
                    </Link>
                    <Link
                      href={`/${locale}/dashboard/divisions/${div.id}/edit`}
                      className="flex-1"
                    >
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
            <p className="text-muted-foreground mb-4">
              {t("divisions.noDivisions")}
            </p>
            <Link href={`/${locale}/dashboard/divisions/new`}>
              <Button>{t("divisions.createFirst")}</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
