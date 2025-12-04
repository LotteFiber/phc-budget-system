"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { submitExpenseForApproval } from "@/actions/expense";

type SubmitExpenseButtonProps = {
  expenseId: string;
  locale: string;
};

export default function SubmitExpenseButton({ expenseId, locale }: SubmitExpenseButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!confirm(t("expense.confirmSubmit") || "Submit this expense for approval?")) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await submitExpenseForApproval(expenseId);

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
