"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { approveBudget, rejectBudget, approveExpense, rejectExpense } from "@/actions/approval";

type ApprovalCardProps = {
  approval: any;
  locale: string;
};

export default function ApprovalCard({ approval, locale }: ApprovalCardProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectComments, setRejectComments] = useState("");
  const [error, setError] = useState("");

  const isBudget = approval.type === "BUDGET";
  const item = isBudget ? approval.budget : approval.expense;

  if (!item) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(amount);
  };

  const handleApprove = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = isBudget
        ? await approveBudget(approval.id)
        : await approveExpense(approval.id);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectComments.trim()) {
      setError("Please provide rejection comments");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = isBudget
        ? await rejectBudget(approval.id, rejectComments)
        : await rejectExpense(approval.id, rejectComments);

      if (result.success) {
        setShowRejectDialog(false);
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline">{isBudget ? "Budget" : "Expense"}</Badge>
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Level {approval.level}
              </Badge>
            </div>
            <CardTitle className="text-lg sm:text-xl">{item.name || item.title}</CardTitle>
            <CardDescription className="text-sm">
              {item.nameLocal || item.titleLocal} • {item.code}
            </CardDescription>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xl sm:text-2xl font-bold">
              {formatCurrency(Number(isBudget ? item.allocatedAmount : item.amount))}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t("common.department")}</p>
              <p className="font-medium">{item.department.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("common.category")}</p>
              <p className="font-medium">{item.category.name}</p>
            </div>
            {isBudget && (
              <>
                <div>
                  <p className="text-muted-foreground">{t("budget.fiscalYear")}</p>
                  <p className="font-medium">{item.fiscalYear}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("budget.period")}</p>
                  <p className="font-medium text-xs sm:text-sm">
                    {new Date(item.startDate).toLocaleDateString("th-TH")} -{" "}
                    {new Date(item.endDate).toLocaleDateString("th-TH")}
                  </p>
                </div>
              </>
            )}
            {!isBudget && (
              <>
                <div>
                  <p className="text-muted-foreground">{t("expense.budget")}</p>
                  <p className="font-medium">{item.budget.code}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("expense.date")}</p>
                  <p className="font-medium">
                    {new Date(item.expenseDate).toLocaleDateString("th-TH")}
                  </p>
                </div>
              </>
            )}
            <div>
              <p className="text-muted-foreground">{t("common.createdBy")}</p>
              <p className="font-medium">{item.createdBy.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("common.createdAt")}</p>
              <p className="font-medium">
                {new Date(approval.createdAt).toLocaleDateString("th-TH")}
              </p>
            </div>
          </div>

          {item.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t("common.description")}</p>
              <p className="text-sm">{item.description}</p>
              {item.descriptionLocal && (
                <p className="text-sm text-muted-foreground mt-1">{item.descriptionLocal}</p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button onClick={handleApprove} disabled={isLoading} className="flex-1">
              {isLoading ? t("common.loading") : t("approval.approve")}
            </Button>

            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" disabled={isLoading} className="flex-1">
                  {t("approval.reject")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
                <DialogHeader>
                  <DialogTitle>{t("approval.rejectTitle")}</DialogTitle>
                  <DialogDescription>{t("approval.rejectDescription")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="comments">{t("approval.comments")} *</Label>
                    <textarea
                      id="comments"
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={rejectComments}
                      onChange={(e) => setRejectComments(e.target.value)}
                      disabled={isLoading}
                      placeholder={t("approval.commentsPlaceholder")}
                      required
                    />
                  </div>
                  {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {error}
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={handleReject} disabled={isLoading} variant="destructive" className="flex-1">
                      {isLoading ? t("common.loading") : t("approval.confirmReject")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectDialog(false)}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
