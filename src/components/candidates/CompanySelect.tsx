"use client";

import type { CvFlipCompanyAccess } from "@/types/cv-flip";

type Props = {
  value: string;
  onChange: (value: string) => void;
  companies: CvFlipCompanyAccess[];
};

export default function CompanySelect({ value, onChange, companies }: Props) {
  return (
    <select
      className="w-[450px] min-w-0 shrink rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="" disabled>
        Chọn doanh nghiệp
      </option>
      {companies.map((company) => (
        <option key={company.id} value={company.id} style={{ whiteSpace: "normal" }}>
          {company.name}
        </option>
      ))}
    </select>
  );
}
