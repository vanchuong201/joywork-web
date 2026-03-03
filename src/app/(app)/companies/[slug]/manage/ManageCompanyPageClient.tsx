"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
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
      <div className="min-h-screen bg-[var(--background)] pb-24">
        {/* Management Top Bar */}
        <div className="sticky top-14 z-30 border-b border-[var(--border)] bg-[var(--card)]/95 px-2 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/85 sm:px-6 sm:py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3">
            <Link
              href={`/companies/${company.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Xem trang công khai</span><span className="sm:hidden">Trang công khai</span>
            </Link>
            <div className="inline-flex items-center gap-1 rounded-full border border-[var(--brand)]/20 bg-[var(--brand)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--brand)] sm:gap-1.5 sm:px-3 sm:text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Trang quản trị</span>
              <span className="sm:hidden">Quản trị</span>
            </div>
          </div>
        </div>

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
