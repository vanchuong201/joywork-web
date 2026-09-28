"use client";

import { use } from "react";

import ApplicationSnapshotScreen from "@/components/company/applications/ApplicationSnapshotScreen";
import CompanyManageGuard from "@/components/company/CompanyManageGuard";

type Props = {
  params: Promise<{ slug: string; applicationId: string }>;
};

export default function CompanyApplicationDetailPage({ params }: Props) {
  const { slug, applicationId } = use(params);

  return (
    <CompanyManageGuard>
      <ApplicationSnapshotScreen companySlug={slug} applicationId={applicationId} />
    </CompanyManageGuard>
  );
}
