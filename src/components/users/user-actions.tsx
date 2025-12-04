"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MoreHorizontal, Pencil, Trash2, Eye, Loader2, Power } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
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
import { deleteUser, toggleUserStatus } from "@/actions/user";

interface UserActionsProps {
  user: {
    id: string;
    name: string;
    isActive: boolean;
    role: string;
  };
  locale: string;
  canEdit: boolean;
  canDelete: boolean;
  hasCreatedContent: boolean;
  currentUserId?: string;
  currentUserRole?: string;
}

export default function UserActions({
  user,
  locale,
  canEdit,
  canDelete,
  hasCreatedContent,
  currentUserId,
  currentUserRole,
}: UserActionsProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isCurrentUser = currentUserId === user.id;
  const isSameRole = currentUserRole === user.role;

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deleteUser(user.id);
        if (result.success) {
          toast.success("User deleted successfully");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to delete user");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
      } finally {
        setShowDeleteDialog(false);
      }
    });
  };

  const handleToggleStatus = async () => {
    // Check if trying to deactivate own account
    if (isCurrentUser && user.isActive) {
      toast.error("Cannot deactivate your own account", {
        description: "Please ask another administrator to deactivate your account if needed.",
      });
      return;
    }

    // Warn if trying to deactivate someone with the same role
    if (isSameRole && user.isActive && !isCurrentUser) {
      toast.warning(`Deactivating a user with the same role (${user.role})`, {
        description: "Please confirm you want to proceed with this action.",
      });
    }

    startTransition(async () => {
      try {
        const result = await toggleUserStatus(user.id);
        if (result.success) {
          toast.success(
            `User ${result.data?.isActive ? "activated" : "deactivated"} successfully`
          );
          router.refresh();
        } else {
          toast.error(result.error || "Failed to toggle user status");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => router.push(`/${locale}/dashboard/users/${user.id}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {t("common.view")}
          </DropdownMenuItem>
          {canEdit && (
            <>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/${locale}/dashboard/users/${user.id}/edit`)
                }
              >
                <Pencil className="mr-2 h-4 w-4" />
                {t("common.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleStatus} disabled={isPending}>
                <Power className="mr-2 h-4 w-4" />
                {user.isActive ? "Deactivate" : "Activate"}
              </DropdownMenuItem>
            </>
          )}
          {canDelete && !hasCreatedContent && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("common.delete")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user <strong>{user.name}</strong>? This action cannot be undone.
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
    </>
  );
}
