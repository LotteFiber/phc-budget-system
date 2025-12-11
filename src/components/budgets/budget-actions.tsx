"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { deleteBudget } from "@/actions/budget";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Eye } from "lucide-react";

type BudgetActionsProps = {
  budgetId: string;
  budgetCode: string;
  locale: string;
  userRole: string;
  basePath?: string;
};

export default function BudgetActions({
  budgetId,
  budgetCode,
  locale,
  userRole,
  basePath = "budgets",
}: BudgetActionsProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState("");

  const canEdit = userRole === "SUPER_ADMIN" || userRole === "ADMIN";
  const canDelete = userRole === "SUPER_ADMIN";

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");

    try {
      const result = await deleteBudget(budgetId);

      if (result.success) {
        setShowDeleteDialog(false);
        router.refresh();
      } else {
        setError(result.error || "Failed to delete budget");
      }
    } catch (err) {
      console.error("Delete budget error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">{t("common.actions")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* View */}
          <DropdownMenuItem
            onClick={() => router.push(`/${locale}/dashboard/${basePath}/${budgetId}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {t("common.view")}
          </DropdownMenuItem>

          {/* Edit - only for ADMIN and SUPER_ADMIN */}
          {canEdit && (
            <DropdownMenuItem
              onClick={() =>
                router.push(`/${locale}/dashboard/${basePath}/${budgetId}/edit`)
              }
            >
              <Pencil className="h-4 w-4 mr-2" />
              {t("common.edit")}
            </DropdownMenuItem>
          )}

          {/* Delete - only for SUPER_ADMIN */}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("common.delete")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("budget.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("budget.deleteConfirmMessage", { code: budgetCode })}
              <br />
              <span className="text-destructive font-semibold">
                {t("common.actionCannotBeUndone")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("common.loading") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
