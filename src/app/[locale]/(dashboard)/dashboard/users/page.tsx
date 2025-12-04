import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserRole } from "@prisma/client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function UsersPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const session = await auth();

  // Fetch users
  const users = await prisma.user.findMany({
    include: {
      division: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const getRoleBadge = (role: UserRole) => {
    const roleMap: Record<UserRole, { label: string; className: string }> = {
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
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      },
      VIEWER: {
        label: "Viewer",
        className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
    };

    const config = roleMap[role];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("nav.users")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t("users.description")}</p>
        </div>
        <Button>{t("users.createNew")}</Button>
      </div>

      {users.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("users.name")}</TableHead>
                  <TableHead>{t("users.email")}</TableHead>
                  <TableHead>{t("users.division")}</TableHead>
                  <TableHead>{t("users.role")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.division?.name || "-"}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>-</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm">
                          {t("common.view")}
                        </Button>
                        <Button variant="ghost" size="sm">
                          {t("common.edit")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                      {getRoleBadge(user.role)}
                    </div>

                    <div className="text-sm">
                      <p className="text-muted-foreground">{t("users.division")}</p>
                      <p className="font-medium truncate">{user.division?.name || "-"}</p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        {t("common.view")}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        {t("common.edit")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">{t("users.noUsers")}</p>
            <Button>{t("users.createFirst")}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
