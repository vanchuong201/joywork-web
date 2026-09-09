"use client";

import { Building2, ChevronDown } from "lucide-react";
import { CompanyAvatar } from "@/components/company/CompanyAvatar";
import type { CvFlipCompanyAccess, CvFlipUsage } from "@/types/cv-flip";
import CvFlipUsageBadge from "./CvFlipUsageBadge";

type Props = {
  company: CvFlipCompanyAccess;
  usage?: CvFlipUsage;
  onChangeClick?: () => void;
};

export default function SelectedCompanySummary({ company, usage, onChangeClick }: Props) {
  const companyRow = (
    <>
      <CompanyAvatar
        logoUrl={company.logoUrl}
        badges={company.badges}
        name={company.name}
        size={36}
        shape="square"
        imgClassName="object-cover"
        fallback={
          <div className="flex h-full w-full items-center justify-center rounded-md bg-[var(--muted)]/40">
            <Building2 className="h-5 w-5 text-[var(--muted-foreground)]" />
          </div>
        }
      />
      <div className="min-w-0">
        <p className="text-xs text-[var(--muted-foreground)]">Đang xem với vai trò</p>
        <p className="flex items-center gap-1 truncate text-base font-semibold text-[var(--foreground)]">
          <span className="truncate">{company.name}</span>
          {onChangeClick ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden />
          ) : null}
        </p>
      </div>
    </>
  );

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[var(--border)] bg-[var(--muted)]/25 px-3 py-2.5">
      {onChangeClick ? (
        <button
          type="button"
          onClick={onChangeClick}
          className="inline-flex min-w-0 flex-1 items-center gap-2.5 rounded-lg text-left transition-colors hover:bg-[var(--muted)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2"
          aria-label={`Đang xem với ${company.name}. Chọn doanh nghiệp khác`}
        >
          {companyRow}
        </button>
      ) : (
        <div className="inline-flex min-w-0 flex-1 items-center gap-2.5">{companyRow}</div>
      )}
      {company.cvFlipEnabled ? <CvFlipUsageBadge usage={usage} /> : null}
    </div>
  );
}
