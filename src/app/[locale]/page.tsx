import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleHomePage({ params }: Props) {
  const { locale } = await params;
  const session = await auth();

  // Redirect based on authentication status
  if (session) {
    redirect(`/${locale}/dashboard`);
  } else {
    redirect(`/${locale}/login`);
  }
}
