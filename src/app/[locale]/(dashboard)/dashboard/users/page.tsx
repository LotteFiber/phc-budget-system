import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getUsers } from "@/actions/user";
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
import Link from "next/link";
import UserActions from "@/components/users/user-actions";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function UsersPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const session = await auth();

  // Fetch users
  const usersResult = await getUsers();
  const users = usersResult.success ? usersResult.data || [] : [];

  const userRole = session?.user?.role || "VIEWER";
  const canCreate = userRole === "SUPER_ADMIN" || userRole === "ADMIN";
  const canEdit = userRole === "SUPER_ADMIN" || userRole === "ADMIN";
  const canDelete = userRole === "SUPER_ADMIN";

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
        {canCreate && (
          <Link href={`/${locale}/dashboard/users/new`}>
            <Button>{t("users.createNew")}</Button>
          </Link>
        )}
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
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const hasCreatedContent =
                    user._count.createdBudgets > 0 || user._count.createdExpenses > 0;
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.division?.nameLocal || "-"}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <UserActions
                          user={{
                            id: user.id,
                            name: user.name,
                            isActive: user.isActive,
                            role: user.role,
                          }}
                          locale={locale}
                          canEdit={canEdit || session?.user?.id === user.id}
                          canDelete={canDelete}
                          hasCreatedContent={hasCreatedContent}
                          currentUserId={session?.user?.id}
                          currentUserRole={session?.user?.role}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {users.map((user) => {
              const hasCreatedContent =
                user._count.createdBudgets > 0 || user._count.createdExpenses > 0;
              return (
                <Card key={user.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{user.name}</p>
                            <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(user.role)}
                          <UserActions
                            user={{
                              id: user.id,
                              name: user.name,
                              isActive: user.isActive,
                              role: user.role,
                            }}
                            locale={locale}
                            canEdit={canEdit || session?.user?.id === user.id}
                            canDelete={canDelete}
                            hasCreatedContent={hasCreatedContent}
                            currentUserId={session?.user?.id}
                            currentUserRole={session?.user?.role}
                          />
                        </div>
                      </div>

                      <div className="text-sm">
                        <p className="text-muted-foreground">{t("users.division")}</p>
                        <p className="font-medium truncate">{user.division?.nameLocal || "-"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">{t("users.noUsers")}</p>
            {canCreate && (
              <Link href={`/${locale}/dashboard/users/new`}>
                <Button>{t("users.createFirst")}</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
