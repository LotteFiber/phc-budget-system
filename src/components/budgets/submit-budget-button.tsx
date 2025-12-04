"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { submitBudgetForApproval } from "@/actions/budget";

type SubmitBudgetButtonProps = {
  budgetId: string;
  locale: string;
};

export default function SubmitBudgetButton({ budgetId, locale }: SubmitBudgetButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!confirm(t("budget.confirmSubmit") || "Submit this budget for approval?")) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await submitBudgetForApproval(budgetId);

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

  return (
    <div>
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? t("common.loading") : t("common.submit")}
      </Button>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
