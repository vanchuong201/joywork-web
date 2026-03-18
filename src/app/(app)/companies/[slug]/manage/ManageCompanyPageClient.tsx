"use client";

import CompanyProfileHero from "@/components/company/profile/CompanyProfileHero";
import ManageCompanyTabs from "@/components/company/ManageCompanyTabs";
import CompanyManageGuard from "@/components/company/CompanyManageGuard";
import CompanyModeSwitchBar from "@/components/company/CompanyModeSwitchBar";
import { Company } from "@/types/company";

type Props = {
  company: Company;
  tab: string;
};

export default function ManageCompanyPageClient({ company, tab }: Props) {
  return (
    <CompanyManageGuard>
      <div className="min-h-screen bg-[var(--background)] pb-24">
        {/* Management Top Bar */}
        <CompanyModeSwitchBar slug={company.slug} mode="manage" />

        {/* Hero Section */}
        <CompanyProfileHero company={company} isEditable={true} />

        {/* Main Content & Tabs */}
        <div className="mx-auto max-w-7xl px-1 sm:px-6">
          <ManageCompanyTabs company={company} initialTab={tab} />
        </div>
      </div>
    </CompanyManageGuard>
  );
}
