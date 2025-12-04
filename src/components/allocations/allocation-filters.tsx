"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Division = {
  id: string;
  nameLocal: string;
};

type Output = {
  id: string;
  nameLocal: string;
};

type Category = {
  id: string;
  nameLocal: string;
};

type Allocation = {
  id: string;
  nameLocal: string;
};

type AllocationFiltersProps = {
  divisions: Division[];
  outputs: Output[];
  categories: Category[];
  allocations: Allocation[];
  locale: string;
};

export default function AllocationFilters({
  divisions,
  outputs,
  categories,
  allocations,
  locale,
}: AllocationFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();

  const currentDivision = searchParams.get("divisionId") || "all";
  const currentOutput = searchParams.get("outputId") || "all";
  const currentProject = searchParams.get("projectId") || "all";
  const currentCategory = searchParams.get("categoryId") || "all";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.push(`/${locale}/dashboard/allocations?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Division Filter */}
      <div className="space-y-2">
        <Label>{t("budget.allocation.divisionName")}</Label>
        <Select
          value={currentDivision}
          onValueChange={(value) => updateFilter("divisionId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("budget.allocation.selectDivision")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("budget.allocation.all")}</SelectItem>
            {divisions.map((division) => (
              <SelectItem key={division.id} value={division.id}>
                {division.nameLocal}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <Label>{t("budget.allocation.category")}</Label>
        <Select
          value={currentCategory}
          onValueChange={(value) => updateFilter("categoryId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("budget.allocation.selectCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("budget.allocation.all")}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.nameLocal}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Output Filter */}
      <div className="space-y-2">
        <Label>{t("budget.allocation.output")}</Label>
        <Select
          value={currentOutput}
          onValueChange={(value) => updateFilter("outputId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("budget.allocation.selectOutput")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("budget.allocation.all")}</SelectItem>
            {outputs.map((output) => (
              <SelectItem key={output.id} value={output.id}>
                {output.nameLocal}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Project Filter */}
      <div className="space-y-2">
        <Label>{t("budget.allocation.project")}</Label>
        <Select
          value={currentProject}
          onValueChange={(value) => updateFilter("projectId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("budget.allocation.selectProject")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("budget.allocation.all")}</SelectItem>
            {allocations.map((allocation) => (
              <SelectItem key={allocation.id} value={allocation.id}>
                {allocation.nameLocal}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
