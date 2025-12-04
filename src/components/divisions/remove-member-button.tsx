"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserMinus, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignUserToDivision } from "@/actions/user";
import { getDivisions } from "@/actions/division";

interface RemoveMemberButtonProps {
  userId: string;
  userName: string;
  userNameLocal?: string | null;
  currentDivisionId: string;
  currentDivisionName: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "ghost";
}

interface Division {
  id: string;
  nameLocal: string;
}

export default function RemoveMemberButton({
  userId,
  userName,
  userNameLocal,
  currentDivisionId,
  currentDivisionName,
  size = "icon",
  variant = "ghost",
}: RemoveMemberButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivisionId, setSelectedDivisionId] = useState<string>("");
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(false);

  // Fetch divisions when dialog opens
  useEffect(() => {
    if (open) {
      fetchDivisions();
    }
  }, [open]);

  const fetchDivisions = async () => {
    setIsLoadingDivisions(true);
    try {
      const result = await getDivisions();
      if (result.success && result.data) {
        // Filter out the current division
        const otherDivisions = result.data.filter(
          (div) => div.id !== currentDivisionId
        );
        setDivisions(otherDivisions);
      } else {
        toast.error("Failed to load divisions");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoadingDivisions(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedDivisionId) {
      toast.error("Please select a division to reassign the member to");
      return;
    }

    startTransition(async () => {
      try {
        const result = await assignUserToDivision(userId, selectedDivisionId);
        if (result.success) {
          const targetDivision = divisions.find(
            (d) => d.id === selectedDivisionId
          );
          toast.success(
            `${userName} has been moved to ${targetDivision?.nameLocal || "another division"}`
          );
          setOpen(false);
          setSelectedDivisionId("");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to reassign member");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
      }
    });
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        title={`Remove ${userName} from ${currentDivisionName}`}
      >
        <UserMinus className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5" />
              Remove Member from Division
            </DialogTitle>
            <DialogDescription>
              Remove <strong>{userNameLocal || userName}</strong> from{" "}
              <strong>{currentDivisionName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-900 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  All users must belong to a division. Please select a division
                  to reassign this member to.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-division">Reassign to Division</Label>
              {isLoadingDivisions ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : divisions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No other divisions available. Please create another division
                  first.
                </p>
              ) : (
                <Select
                  value={selectedDivisionId}
                  onValueChange={setSelectedDivisionId}
                  disabled={isPending}
                >
                  <SelectTrigger id="target-division">
                    <SelectValue placeholder="Select a division..." />
                  </SelectTrigger>
                  <SelectContent>
                    {divisions.map((division) => (
                      <SelectItem key={division.id} value={division.id}>
                        {division.nameLocal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setSelectedDivisionId("");
              }}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleRemove}
              disabled={!selectedDivisionId || isPending || divisions.length === 0}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reassign Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
