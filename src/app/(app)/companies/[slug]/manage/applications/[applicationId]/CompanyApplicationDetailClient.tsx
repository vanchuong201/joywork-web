"use client";

import ApplicationSnapshotScreen from "@/components/company/applications/ApplicationSnapshotScreen";
import CompanyManageGuard from "@/components/company/CompanyManageGuard";

type Props = {
  slug: string;
  applicationId: string;
};

export default function CompanyApplicationDetailClient({ slug, applicationId }: Props) {
  return (
    <CompanyManageGuard>
      <ApplicationSnapshotScreen companySlug={slug} applicationId={applicationId} />
    </CompanyManageGuard>
  );
}
