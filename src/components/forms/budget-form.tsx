"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { createBudget, updateBudget } from "@/actions/budget";

type BudgetCategory = {
  id: string;
  code: string;
  name: string;
  nameLocal: string;
};

type Plan = {
  id: string;
  code: string;
  name: string;
  nameLocal: string;
};

type Output = {
  id: string;
  code: string;
  name: string;
  nameLocal: string;
  planId: string;
};

type Activity = {
  id: string;
  code: string;
  name: string;
  nameLocal: string;
  outputId: string;
};

type BudgetFormProps = {
  categories: BudgetCategory[];
  plans: Plan[];
  outputs: Output[];
  activities: Activity[];
  locale: string;
  initialData?: {
    id: string;
    code: string;
    name: string;
    nameLocal: string;
    description?: string;
    descriptionLocal?: string;
    fiscalYear: number;
    divisionId: string;
    categoryId: string;
    planId: string;
    outputId: string;
    activityId: string;
    allocatedAmount: number;
    startDate: string;
    endDate: string;
  };
};

export default function BudgetForm({
  categories,
  plans,
  outputs,
  activities,
  locale,
  initialData,
}: BudgetFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fiscalYear:
      initialData?.fiscalYear || (new Date().getFullYear() + 543).toString(),
    categoryId: initialData?.categoryId || "",
    planId: initialData?.planId || "",
    outputId: initialData?.outputId || "",
    activityId: initialData?.activityId || "",
    allocatedAmount: initialData?.allocatedAmount || "",
    // Custom name fields
    customPlanName: "",
    customOutputName: "",
    customActivityName: "",
  });

  // Toggle states for custom inputs
  const [useCustomPlan, setUseCustomPlan] = useState(false);
  const [useCustomOutput, setUseCustomOutput] = useState(false);
  const [useCustomActivity, setUseCustomActivity] = useState(false);

  // Filter outputs based on selected plan
  const filteredOutputs = formData.planId
    ? outputs.filter((output) => output.planId === formData.planId)
    : [];

  // Filter activities based on selected output
  const filteredActivities = formData.outputId
    ? activities.filter((activity) => activity.outputId === formData.outputId)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = {
        fiscalYear: Number(formData.fiscalYear),
        categoryId: formData.categoryId,
        planId: useCustomPlan ? "" : formData.planId,
        outputId: useCustomOutput ? "" : formData.outputId,
        activityId: useCustomActivity ? "" : formData.activityId,
        allocatedAmount: Number(formData.allocatedAmount),
        // Custom name fields (only if using custom)
        customPlanName: useCustomPlan ? formData.customPlanName : undefined,
        customOutputName: useCustomOutput
          ? formData.customOutputName
          : undefined,
        customActivityName: useCustomActivity
          ? formData.customActivityName
          : undefined,
      };

      const result = initialData
        ? await updateBudget(initialData.id, data)
        : await createBudget(data);

      if (result.success) {
        router.push(`/${locale}/dashboard/budgets`);
        router.refresh();
      } else {
        setError(result.error || "An error occurred");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="fiscalYear">{t("budget.fiscalYear")} *</Label>
          <Input
            id="fiscalYear"
            type="number"
            value={formData.fiscalYear}
            onChange={(e) =>
              setFormData({ ...formData, fiscalYear: e.target.value })
            }
            required
            disabled={isLoading}
            min="2543"
            max="2643"
            placeholder={(new Date().getFullYear() + 543).toString()}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">
            {t("budget.expenditureCategory")} *
          </Label>
          <Select
            value={formData.categoryId}
            onValueChange={(value) =>
              setFormData({ ...formData, categoryId: value })
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("budget.selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.code} - {cat.nameLocal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="planId">{t("budget.plan")} *</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="useCustomPlan"
                checked={useCustomPlan}
                onCheckedChange={(checked: boolean) => {
                  setUseCustomPlan(checked);
                  if (checked) {
                    setFormData({ ...formData, planId: "" });
                    // Reset downstream fields
                    setUseCustomOutput(true);
                    setUseCustomActivity(true);
                  }
                }}
                disabled={isLoading}
              />
              <Label
                htmlFor="useCustomPlan"
                className="text-sm font-normal cursor-pointer"
              >
                {t("budget.createCustom")}
              </Label>
            </div>
          </div>
          {useCustomPlan ? (
            <Input
              id="customPlanName"
              value={formData.customPlanName}
              onChange={(e) =>
                setFormData({ ...formData, customPlanName: e.target.value })
              }
              placeholder={t("budget.enterPlanName")}
              required
              disabled={isLoading}
            />
          ) : (
            <Select
              value={formData.planId}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  planId: value,
                  outputId: "", // Reset output when plan changes
                  activityId: "", // Reset activity when plan changes
                })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("budget.selectPlan")} />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.code} - {plan.nameLocal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="outputId">{t("budget.outputProject")} *</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="useCustomOutput"
                checked={useCustomOutput}
                onCheckedChange={(checked: boolean) => {
                  setUseCustomOutput(checked);
                  if (checked) {
                    setFormData({ ...formData, outputId: "" });
                    // Reset downstream field
                    setUseCustomActivity(true);
                  }
                }}
                disabled={isLoading || useCustomPlan}
              />
              <Label
                htmlFor="useCustomOutput"
                className="text-sm font-normal cursor-pointer"
              >
                {t("budget.createCustom")}
              </Label>
            </div>
          </div>
          {useCustomOutput ? (
            <Input
              id="customOutputName"
              value={formData.customOutputName}
              onChange={(e) =>
                setFormData({ ...formData, customOutputName: e.target.value })
              }
              placeholder={t("budget.enterOutputName")}
              required
              disabled={isLoading}
            />
          ) : (
            <Select
              value={formData.outputId}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  outputId: value,
                  activityId: "", // Reset activity when output changes
                })
              }
              disabled={isLoading || !formData.planId}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("budget.selectOutput")} />
              </SelectTrigger>
              <SelectContent>
                {filteredOutputs.map((output) => (
                  <SelectItem key={output.id} value={output.id}>
                    {output.code} - {output.nameLocal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="activityId">{t("budget.activity")} *</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="useCustomActivity"
                checked={useCustomActivity}
                onCheckedChange={(checked: boolean) => {
                  setUseCustomActivity(checked);
                  if (checked) {
                    setFormData({ ...formData, activityId: "" });
                  }
                }}
                disabled={isLoading || useCustomOutput}
              />
              <Label
                htmlFor="useCustomActivity"
                className="text-sm font-normal cursor-pointer"
              >
                {t("budget.createCustom")}
              </Label>
            </div>
          </div>
          {useCustomActivity ? (
            <Input
              id="customActivityName"
              value={formData.customActivityName}
              onChange={(e) =>
                setFormData({ ...formData, customActivityName: e.target.value })
              }
              placeholder={t("budget.enterActivityName")}
              required
              disabled={isLoading}
            />
          ) : (
            <Select
              value={formData.activityId}
              onValueChange={(value) =>
                setFormData({ ...formData, activityId: value })
              }
              disabled={isLoading || !formData.outputId}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("budget.selectActivity")} />
              </SelectTrigger>
              <SelectContent>
                {filteredActivities.map((activity) => (
                  <SelectItem key={activity.id} value={activity.id}>
                    {activity.code} - {activity.nameLocal}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="allocatedAmount">
            {t("budget.allocated")} ({t("common.currencyUnit")}) *
          </Label>
          <Input
            id="allocatedAmount"
            type="number"
            step="0.0001"
            value={formData.allocatedAmount}
            onChange={(e) => {
              const value = e.target.value;
              // Check if value has more than 4 decimal places
              if (value.includes(".")) {
                const decimalPlaces = value.split(".")[1]?.length || 0;
                if (decimalPlaces > 4) return;
              }
              setFormData({
                ...formData,
                allocatedAmount: value,
              });
            }}
            required
            disabled={isLoading}
            min="0"
            placeholder="0.0000"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? t("common.saving")
            : initialData
              ? t("common.update")
              : t("common.create")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${locale}/dashboard/budgets`)}
          disabled={isLoading}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
