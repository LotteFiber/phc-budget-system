import { getTranslations } from "next-intl/server";
import { getDivisionById } from "@/actions/division";
import { notFound } from "next/navigation";
import DivisionForm from "@/components/forms/division-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditDivisionPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });

  const divisionResult = await getDivisionById(id);

  if (!divisionResult.success || !divisionResult.data) {
    notFound();
  }

  const division = divisionResult.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("divisions.edit")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Update division information
        </p>
      </div>

      <DivisionForm division={division} locale={locale} />
    </div>
  );
}
