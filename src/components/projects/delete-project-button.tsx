"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import { deleteBudgetAllocation } from "@/actions/budget-allocation";

interface DeleteProjectButtonProps {
  id: string;
  locale: string;
  hasExpenses: boolean;
}

export default function DeleteProjectButton({
  id,
  locale,
  hasExpenses,
}: DeleteProjectButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deleteBudgetAllocation(id);
        if (result.success) {
          toast.success("Project deleted successfully");
          router.push(`/${locale}/dashboard/projects`);
          router.refresh();
        } else {
          toast.error(result.error || "Failed to delete project");
          setOpen(false);
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
        setOpen(false);
      }
    });
  };

  if (hasExpenses) {
    return (
      <Button
        variant="destructive"
        size="sm"
        className="gap-2"
        disabled
        title="Cannot delete project with existing expenses"
      >
        <Trash2 className="h-4 w-4" />
        {t("common.delete")}
      </Button>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <Trash2 className="h-4 w-4" />
          {t("common.delete")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("budget.allocation.deleteConfirmation")}
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
  );
}
