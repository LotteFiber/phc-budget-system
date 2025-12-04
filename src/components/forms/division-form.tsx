"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createDivision, updateDivision } from "@/actions/division";

type Division = {
  id?: string;
  nameLocal?: string | null;
  descriptionLocal?: string | null;
};

type DivisionFormProps = {
  division?: Division;
  locale: string;
};

export default function DivisionForm({ division, locale }: DivisionFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    nameLocal: division?.nameLocal || "",
    descriptionLocal: division?.descriptionLocal || "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = {
        nameLocal: formData.nameLocal,
        descriptionLocal: formData.descriptionLocal || undefined,
      };

      const result = division?.id
        ? await updateDivision(division.id, data)
        : await createDivision(data);

      if (result.success) {
        router.push(`/${locale}/dashboard/divisions`);
        router.refresh();
      } else {
        // Enhanced error messages
        const errorMessage = result.error || "An error occurred";
        console.error("Division form error:", errorMessage);
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Division form exception:", err);
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {division?.id ? t("divisions.edit") : t("divisions.create")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-6 grid-cols-1">
            {/* Name (Thai) */}
            <div className="space-y-2">
              <Label htmlFor="nameLocal">
                {t("divisions.name")} (ไทย){" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nameLocal"
                value={formData.nameLocal}
                onChange={(e) => handleChange("nameLocal", e.target.value)}
                placeholder="e.g., กองสาธารณสุขปฐมภูมิ"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Description (Local) */}
          <div className="space-y-2">
            <Label htmlFor="descriptionLocal">
              {t("common.description")} (ไทย)
            </Label>
            <Textarea
              id="descriptionLocal"
              value={formData.descriptionLocal}
              onChange={(e) => handleChange("descriptionLocal", e.target.value)}
              placeholder="กรอกคำอธิบายกอง..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? t("common.loading") : t("common.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {t("common.cancel")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
