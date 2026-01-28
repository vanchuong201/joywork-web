"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CompanyProfileHero from "@/components/company/profile/CompanyProfileHero";
import ManageCompanyTabs from "@/components/company/ManageCompanyTabs";
import CompanyManageGuard from "@/components/company/CompanyManageGuard";
import { Company } from "@/types/company";

type Props = {
  company: Company;
  tab: string;
};

export default function ManageCompanyPageClient({ company, tab }: Props) {
  return (
    <CompanyManageGuard>
      <div className="min-h-screen bg-[var(--background)] font-sans pb-20">
        {/* Top Bar for Manager */}
        <div className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-30 px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Link
              href={`/companies/${company.slug}`}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-2 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Xem trang công khai
            </Link>
            <div className="h-4 w-px bg-[var(--border)]" />
            <span className="font-bold text-[var(--foreground)]">Trang quản trị</span>
          </div>
        </div>

        {/* Hero Section */}
        <CompanyProfileHero company={company} isEditable={true} />

        {/* Main Content & Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <ManageCompanyTabs company={company} initialTab={tab} />
        </div>
      </div>
    </CompanyManageGuard>
  );
}
