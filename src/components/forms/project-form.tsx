"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBudgetAllocation,
  updateBudgetAllocation,
} from "@/actions/budget-allocation";

type Budget = {
  id: string;
  code: string;
  name: string;
  nameLocal: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  fiscalYear: number;
  division: {
    nameLocal: string;
  };
};

type ProjectFormProps = {
  budgets: Budget[];
  initialData?: {
    id: string;
    nameLocal: string;
    descriptionLocal?: string;
    budgetId: string;
    allocatedAmount: number;
    startDate: string;
    endDate: string;
  };
  locale: string;
};

export default function ProjectForm({
  budgets,
  initialData,
  locale,
}: ProjectFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  const [formData, setFormData] = useState({
    nameLocal: initialData?.nameLocal || "",
    descriptionLocal: initialData?.descriptionLocal || "",
    budgetId: initialData?.budgetId || "",
    allocatedAmount: initialData?.allocatedAmount?.toString() || "",
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
  });

  const selectedBudget = budgets.find((b) => b.id === formData.budgetId);
  const availableBudget = selectedBudget
    ? selectedBudget.remainingAmount + (initialData?.allocatedAmount || 0)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedBudget) {
      setError("Please select a budget");
      return;
    }

    const allocatedAmount = parseFloat(formData.allocatedAmount);
    if (isNaN(allocatedAmount) || allocatedAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const data = {
      nameLocal: formData.nameLocal,
      descriptionLocal: formData.descriptionLocal || undefined,
      budgetId: formData.budgetId,
      divisionId: selectedBudget.division?.nameLocal || "",
      allocatedAmount,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
    };

    startTransition(async () => {
      const result = initialData
        ? await updateBudgetAllocation(initialData.id, data)
        : await createBudgetAllocation(data);

      if (result.success) {
        router.push(`/${locale}/dashboard/projects`);
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Budget Selection */}
      <div className="space-y-2">
        <Label htmlFor="budgetId">
          {t("expense.budget")} <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.budgetId}
          onValueChange={(value) =>
            setFormData({ ...formData, budgetId: value })
          }
          disabled={!!initialData}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("expense.selectBudget")} />
          </SelectTrigger>
          <SelectContent>
            {budgets.map((budget) => (
              <SelectItem key={budget.id} value={budget.id}>
                {budget.code} - {budget.nameLocal} (
                {t("expense.remainingBudget")}:{" "}
                {budget.remainingAmount.toLocaleString()} THB)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedBudget && (
          <p className="text-sm text-muted-foreground">
            {t("expense.remainingBudget")}:{" "}
            <span className="font-semibold">
              {availableBudget.toLocaleString()} THB
            </span>
          </p>
        )}
      </div>

      {/* Name Local (Thai) */}
      <div className="space-y-2">
        <Label htmlFor="nameLocal">
          {t("budget.allocation.projectNameTh")}{" "}
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="nameLocal"
          type="text"
          value={formData.nameLocal}
          onChange={(e) =>
            setFormData({ ...formData, nameLocal: e.target.value })
          }
          required
        />
      </div>

      {/* Description Local (Thai) */}
      <div className="space-y-2">
        <Label htmlFor="descriptionLocal">รายละเอียด</Label>
        <Textarea
          id="descriptionLocal"
          value={formData.descriptionLocal}
          onChange={(e) =>
            setFormData({ ...formData, descriptionLocal: e.target.value })
          }
          rows={3}
        />
      </div>

      {/* Allocated Amount */}
      <div className="space-y-2">
        <Label htmlFor="allocatedAmount">
          {t("budget.allocatedAmount")} (บาท){" "}
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="allocatedAmount"
          type="number"
          step="0.01"
          min="0"
          value={formData.allocatedAmount}
          onChange={(e) =>
            setFormData({ ...formData, allocatedAmount: e.target.value })
          }
          required
        />
        {selectedBudget && parseFloat(formData.allocatedAmount) > 0 && (
          <p
            className={`text-sm ${
              parseFloat(formData.allocatedAmount) > availableBudget
                ? "text-red-600 dark:text-red-400 font-semibold"
                : "text-muted-foreground"
            }`}
          >
            {parseFloat(formData.allocatedAmount) > availableBudget
              ? `⚠️ Amount exceeds available budget by ${(
                  parseFloat(formData.allocatedAmount) - availableBudget
                ).toLocaleString()} THB`
              : `Remaining after allocation: ${(
                  availableBudget - parseFloat(formData.allocatedAmount)
                ).toLocaleString()} THB`}
          </p>
        )}
      </div>

      {/* Start Date */}
      <div className="space-y-2">
        <Label htmlFor="startDate">
          {t("budget.startDate")} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="startDate"
          type="date"
          value={formData.startDate}
          onChange={(e) =>
            setFormData({ ...formData, startDate: e.target.value })
          }
          required
        />
      </div>

      {/* End Date */}
      <div className="space-y-2">
        <Label htmlFor="endDate">
          {t("budget.endDate")} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="endDate"
          type="date"
          value={formData.endDate}
          onChange={(e) =>
            setFormData({ ...formData, endDate: e.target.value })
          }
          required
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? t("common.saving") : t("common.save")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
