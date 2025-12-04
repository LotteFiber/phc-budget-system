import { getTranslations } from "next-intl/server";
import { getPendingApprovals } from "@/actions/approval";
import ApprovalCard from "@/components/approvals/approval-card";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ApprovalsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  // Fetch pending approvals
  const approvalsResult = await getPendingApprovals();
  const approvals = approvalsResult.success ? approvalsResult.data || [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("approval.title")}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">{t("approval.pendingDescription")}</p>
      </div>

      {approvals.length > 0 ? (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} locale={locale} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">{t("approval.noPendingApprovals")}</p>
        </div>
      )}
    </div>
  );
}
