import { getTranslations } from "next-intl/server";
import UserForm from "@/components/forms/user-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NewUserPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("users.create")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Create a new user account
        </p>
      </div>

      <UserForm locale={locale} />
    </div>
  );
}
