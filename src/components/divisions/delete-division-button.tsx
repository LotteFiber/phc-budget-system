"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2, Loader2, AlertCircle, Users, Wallet, Receipt } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteDivision } from "@/actions/division";

interface DeleteDivisionButtonProps {
  id: string;
  name: string;
  locale: string;
  hasUsers: boolean;
  hasBudgets: boolean;
  hasExpenses: boolean;
  userCount?: number;
  budgetCount?: number;
  expenseCount?: number;
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
  redirectOnSuccess?: boolean;
}

export default function DeleteDivisionButton({
  id,
  name,
  locale,
  hasUsers,
  hasBudgets,
  hasExpenses,
  userCount = 0,
  budgetCount = 0,
  expenseCount = 0,
  variant = "ghost",
  size = "sm",
  showIcon = true,
  redirectOnSuccess = false,
}: DeleteDivisionButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [showDependencyDialog, setShowDependencyDialog] = useState(false);

  const hasDependencies = hasUsers || hasBudgets || hasExpenses;

  const getDependencyMessage = () => {
    if (hasUsers) return t("divisions.cannotDeleteWithUsers");
    if (hasBudgets) return t("divisions.cannotDeleteWithBudgets");
    if (hasExpenses) return t("divisions.cannotDeleteWithExpenses");
    return "";
  };

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deleteDivision(id);
        if (result.success) {
          toast.success(t("divisions.deleteSuccess"));
          setOpen(false);
          if (redirectOnSuccess) {
            router.push(`/${locale}/dashboard/divisions`);
          }
          router.refresh();
        } else {
          toast.error(result.error || t("divisions.deleteFailed"));
          setOpen(false);
        }
      } catch (error) {
        toast.error(t("divisions.deleteFailed"));
        console.error(error);
        setOpen(false);
      }
    });
  };

  return (
    <>
      {/* Delete Button - Clickable even with dependencies */}
      {hasDependencies ? (
        <>
          <Button
            variant={variant}
            size={size}
            className="gap-2 text-muted-foreground hover:text-muted-foreground/80"
            onClick={() => setShowDependencyDialog(true)}
            title="Click to see what's blocking deletion"
          >
            {showIcon && <Trash2 className="h-4 w-4" />}
            {t("common.delete")}
          </Button>

          {/* Dependency Information Dialog */}
          <Dialog open={showDependencyDialog} onOpenChange={setShowDependencyDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  Cannot Delete Division
                </DialogTitle>
                <DialogDescription>
                  The division <strong>{name}</strong> cannot be deleted because it has active dependencies.
                  Please resolve these issues first:
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Users/Members Dependency */}
                {hasUsers && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-4">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">
                          {userCount} {userCount === 1 ? "Member" : "Members"} Assigned
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          This division has {userCount} user{userCount === 1 ? "" : "s"} assigned to it.
                          You need to reassign all members to other divisions first.
                        </p>
                        <Link href={`/${locale}/dashboard/divisions/${id}`}>
                          <Button size="sm" variant="outline" className="gap-2">
                            <Users className="h-4 w-4" />
                            View Members
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Budgets Dependency */}
                {hasBudgets && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-4">
                    <div className="flex items-start gap-3">
                      <Wallet className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">
                          {budgetCount} {budgetCount === 1 ? "Budget" : "Budgets"} Associated
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          This division has {budgetCount} budget{budgetCount === 1 ? "" : "s"} associated with it.
                          You need to delete or reassign all budgets first.
                        </p>
                        <Link href={`/${locale}/dashboard/budgets?division=${id}`}>
                          <Button size="sm" variant="outline" className="gap-2">
                            <Wallet className="h-4 w-4" />
                            View Budgets
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expenses Dependency */}
                {hasExpenses && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-4">
                    <div className="flex items-start gap-3">
                      <Receipt className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">
                          {expenseCount} {expenseCount === 1 ? "Expense" : "Expenses"} Recorded
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          This division has {expenseCount} expense{expenseCount === 1 ? "" : "s"} recorded.
                          You need to delete all expenses first.
                        </p>
                        <Link href={`/${locale}/dashboard/allocations?division=${id}`}>
                          <Button size="sm" variant="outline" className="gap-2">
                            <Receipt className="h-4 w-4" />
                            View Expenses
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDependencyDialog(false)}>
                  Close
                </Button>
                <Link href={`/${locale}/dashboard/divisions/${id}`}>
                  <Button className="gap-2">
                    View Division Details
                  </Button>
                </Link>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        // No dependencies - Show normal delete dialog
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              {showIcon && <Trash2 className="h-4 w-4" />}
              {t("common.delete")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("divisions.deleteConfirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("divisions.deleteConfirmMessage", { name })}
                <br />
                <span className="text-destructive font-semibold">
                  {t("common.actionCannotBeUndone")}
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                {t("common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("common.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
