import { getTranslations } from "next-intl/server";
import { getUserById } from "@/actions/user";
import { notFound } from "next/navigation";
import UserForm from "@/components/forms/user-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditUserPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale });

  const result = await getUserById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const user = result.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t("users.edit")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Update user information
        </p>
      </div>

      <UserForm
        user={{
          id: user.id,
          email: user.email,
          name: user.name,
          nameLocal: user.nameLocal,
          role: user.role,
          divisionId: user.divisionId,
          isActive: user.isActive,
        }}
        locale={locale}
      />
    </div>
  );
}
