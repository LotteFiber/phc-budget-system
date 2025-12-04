"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createDepartment, updateDepartment } from "@/actions/department";

type Department = {
  id?: string;
  code: string;
  name: string;
  nameLocal?: string | null;
  description?: string | null;
  descriptionLocal?: string | null;
};

type DepartmentFormProps = {
  department?: Department;
  locale: string;
};

export default function DepartmentForm({
  department,
  locale,
}: DepartmentFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    code: department?.code || "",
    name: department?.name || "",
    nameLocal: department?.nameLocal || "",
    description: department?.description || "",
    descriptionLocal: department?.descriptionLocal || "",
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
        code: formData.code,
        name: formData.name,
        nameLocal: formData.nameLocal || undefined,
        description: formData.description || undefined,
        descriptionLocal: formData.descriptionLocal || undefined,
      };

      const result = department?.id
        ? await updateDepartment(department.id, data)
        : await createDepartment(data);

      if (result.success) {
        router.push(`/${locale}/dashboard/departments`);
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
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {department?.id ? t("departments.edit") : t("departments.create")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                {t("departments.code")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="e.g., PHC-001"
                required
                disabled={isLoading}
              />
            </div>

            {/* Name (English) */}
            <div className="space-y-2">
              <Label htmlFor="name">
                {t("departments.name")} (English) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Primary Health Care Division"
                required
                disabled={isLoading}
              />
            </div>

            {/* Name (Local) */}
            <div className="space-y-2">
              <Label htmlFor="nameLocal">{t("departments.name")} (ไทย)</Label>
              <Input
                id="nameLocal"
                value={formData.nameLocal}
                onChange={(e) => handleChange("nameLocal", e.target.value)}
                placeholder="e.g., กองสาธารณสุขปฐมภูมิ"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Description (English) */}
          <div className="space-y-2">
            <Label htmlFor="description">{t("common.description")} (English)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter department description..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Description (Local) */}
          <div className="space-y-2">
            <Label htmlFor="descriptionLocal">{t("common.description")} (ไทย)</Label>
            <Textarea
              id="descriptionLocal"
              value={formData.descriptionLocal}
              onChange={(e) => handleChange("descriptionLocal", e.target.value)}
              placeholder="กรอกคำอธิบายหน่วยงาน..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-none">
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
