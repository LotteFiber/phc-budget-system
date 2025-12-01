import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import LanguageSwitcher from "@/components/layout/language-switcher";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AuthLayout({ children, params }: Props) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations({ locale });

  // Redirect to dashboard if already logged in
  if (session) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher />
      </div>
      {children}
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          © 2025 {t("common.ministry")} - {t("common.department")}
        </div>
      </footer>
    </div>
  );
}
