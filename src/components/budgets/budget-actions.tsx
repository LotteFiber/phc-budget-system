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
import { Pencil, Trash2, Eye } from "lucide-react";

type BudgetActionsProps = {
  budgetId: string;
  budgetCode: string;
  locale: string;
  userRole: string;
};

export default function BudgetActions({
  budgetId,
  budgetCode,
  locale,
  userRole,
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
      <div className="flex items-center justify-end gap-2">
        {/* View Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/${locale}/dashboard/budgets/${budgetId}`)}
        >
          <Eye className="h-4 w-4 mr-1" />
          {t("common.view")}
        </Button>

        {/* Edit Button - only for ADMIN and SUPER_ADMIN */}
        {canEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/${locale}/dashboard/budgets/${budgetId}/edit`)
            }
          >
            <Pencil className="h-4 w-4 mr-1" />
            {t("common.edit")}
          </Button>
        )}

        {/* Delete Button - only for SUPER_ADMIN */}
        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t("common.delete")}
          </Button>
        )}
      </div>

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
