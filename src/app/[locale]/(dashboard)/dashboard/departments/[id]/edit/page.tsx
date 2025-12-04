import { getTranslations } from "next-intl/server";
import { getDepartmentById } from "@/actions/department";
import { notFound } from "next/navigation";
import DepartmentForm from "@/components/forms/department-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditDepartmentPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });

  const departmentResult = await getDepartmentById(id);

  if (!departmentResult.success || !departmentResult.data) {
    notFound();
  }

  const department = departmentResult.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("departments.edit")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Update department information
        </p>
      </div>

      <DepartmentForm
        department={department}
        locale={locale}
      />
    </div>
  );
}
