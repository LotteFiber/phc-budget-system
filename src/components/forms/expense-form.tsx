"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createExpense, updateExpense } from "@/actions/expense";

type Department = {
  id: string;
  code: string;
  name: string;
  nameLocal: string | null;
  description?: string | null;
  descriptionLocal?: string | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

type BudgetCategory = {
  id: string;
  code: string;
  name: string;
  nameLocal: string;
};

type Budget = {
  id: string;
  code: string;
  name: string;
  nameLocal: string;
  remainingAmount: number;
  categoryId: string;
};

type ExpenseFormProps = {
  departments: Department[];
  categories: BudgetCategory[];
  budgets: Budget[];
  locale: string;
  initialData?: {
    id: string;
    code: string;
    budgetId: string;
    categoryId: string;
    divisionId: string;
    title: string;
    titleLocal?: string;
    description: string;
    descriptionLocal?: string;
    amount: number;
    expenseDate: string;
  };
};

export default function ExpenseForm({
  departments,
  categories,
  budgets: initialBudgets,
  locale,
  initialData,
}: ExpenseFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [budgets, setBudgets] = useState(initialBudgets);

  const [formData, setFormData] = useState({
    code: initialData?.code || "",
    budgetId: initialData?.budgetId || "",
    categoryId: initialData?.categoryId || "",
    divisionId: initialData?.divisionId || "",
    title: initialData?.title || "",
    titleLocal: initialData?.titleLocal || "",
    description: initialData?.description || "",
    descriptionLocal: initialData?.descriptionLocal || "",
    amount: initialData?.amount || 0,
    expenseDate: initialData?.expenseDate || new Date().toISOString().split("T")[0],
  });

  // Filter budgets by department
  useEffect(() => {
    if (formData.divisionId) {
      const filtered = initialBudgets.filter((b) => {
        // Note: You'd need to add divisionId to the Budget type above
        return true; // For now, show all budgets
      });
      setBudgets(filtered);
    } else {
      setBudgets(initialBudgets);
    }
  }, [formData.divisionId, initialBudgets]);

  // Auto-set category when budget is selected
  useEffect(() => {
    if (formData.budgetId && !initialData) {
      const selectedBudget = budgets.find((b) => b.id === formData.budgetId);
      if (selectedBudget) {
        setFormData((prev) => ({ ...prev, categoryId: selectedBudget.categoryId }));
      }
    }
  }, [formData.budgetId, budgets, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = {
        ...formData,
        amount: Number(formData.amount),
        expenseDate: new Date(formData.expenseDate),
      };

      const result = initialData
        ? await updateExpense(initialData.id, data)
        : await createExpense(data);

      if (result.success) {
        router.push(`/${locale}/dashboard/expenses`);
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

  const selectedBudget = budgets.find((b) => b.id === formData.budgetId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="code">{t("expense.code")} *</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            disabled={isLoading || !!initialData}
            placeholder="EXP-2025-001"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expenseDate">{t("expense.date")} *</Label>
          <Input
            id="expenseDate"
            type="date"
            value={formData.expenseDate}
            onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="divisionId">{t("expense.department")} *</Label>
          <Select
            value={formData.divisionId}
            onValueChange={(value) => setFormData({ ...formData, divisionId: value })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("expense.selectDepartment")} />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.code} - {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budgetId">{t("expense.budget")} *</Label>
          <Select
            value={formData.budgetId}
            onValueChange={(value) => setFormData({ ...formData, budgetId: value })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("expense.selectBudget")} />
            </SelectTrigger>
            <SelectContent>
              {budgets.map((budget) => (
                <SelectItem key={budget.id} value={budget.id}>
                  {budget.code} - {budget.name} (฿
                  {budget.remainingAmount.toLocaleString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedBudget && (
            <p className="text-sm text-muted-foreground">
              {t("expense.remainingBudget")}: ฿{selectedBudget.remainingAmount.toLocaleString()}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">{t("expense.category")} *</Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("expense.selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.code} - {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">{t("expense.amount")} *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            required
            disabled={isLoading}
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">{t("expense.title")} (EN) *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            disabled={isLoading}
            placeholder="Office Supplies Purchase"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="titleLocal">{t("expense.title")} (TH)</Label>
          <Input
            id="titleLocal"
            value={formData.titleLocal}
            onChange={(e) => setFormData({ ...formData, titleLocal: e.target.value })}
            disabled={isLoading}
            placeholder="ซื้ออุปกรณ์สำนักงาน"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("expense.description")} (EN) *</Label>
        <textarea
          id="description"
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          disabled={isLoading}
          placeholder="Detailed description of the expense..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descriptionLocal">{t("expense.description")} (TH)</Label>
        <textarea
          id="descriptionLocal"
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={formData.descriptionLocal}
          onChange={(e) => setFormData({ ...formData, descriptionLocal: e.target.value })}
          disabled={isLoading}
          placeholder="รายละเอียดของค่าใช้จ่าย..."
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("common.saving") : initialData ? t("common.update") : t("common.create")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
