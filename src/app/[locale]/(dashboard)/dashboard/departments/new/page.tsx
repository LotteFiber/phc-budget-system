import { getTranslations } from "next-intl/server";
import DepartmentForm from "@/components/forms/department-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NewDepartmentPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("divisions.createNew")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Create a new department in the system
        </p>
      </div>

      <DepartmentForm locale={locale} />
    </div>
  );
}
