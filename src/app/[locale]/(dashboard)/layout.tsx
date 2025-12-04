import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({ children, params }: Props) {
  const session = await auth();
  const { locale } = await params;

  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 w-full pt-20 px-4 sm:px-6 lg:px-8 md:ml-64">
          <div className="mx-auto max-w-7xl pb-20">{children}</div>
        </main>
      </div>
    </div>
  );
}
