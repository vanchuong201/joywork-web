"use client";

import { Building2 } from "lucide-react";
import type { CvFlipCompanyAccess } from "@/types/cv-flip";

type Props = {
  company: CvFlipCompanyAccess;
};

export default function SelectedCompanySummary({ company }: Props) {
  const legal = company.legalName?.trim();
  const showLegal = Boolean(legal && legal !== company.name.trim());

  return (
    <div className="flex min-w-0 max-w-md flex-1 items-center gap-3 rounded-lg border border-[var(--border)] bg-background px-3 py-2">
      {company.logoUrl ? (
        <img
          src={company.logoUrl}
          alt=""
          className="h-10 w-10 shrink-0 rounded-md border border-[var(--border)] object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--muted)]/30">
          <Building2 className="h-5 w-5 text-[var(--muted-foreground)]" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--foreground)]">{company.name}</p>
        {showLegal ? (
          <p className="truncate text-xs text-[var(--muted-foreground)]">{legal}</p>
        ) : null}
      </div>
    </div>
  );
}
