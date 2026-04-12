"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CvFlipCompanyAccess } from "@/types/cv-flip";

type Props = {
  open: boolean;
  companies: CvFlipCompanyAccess[];
  selectedCompanyId: string;
  onSelectedCompanyIdChange: (value: string) => void;
  onConfirm: () => void;
  onCreateCompany?: () => void;
};

export default function CompanySelectorModal({
  open,
  companies,
  selectedCompanyId,
  onSelectedCompanyIdChange,
  onConfirm,
  onCreateCompany,
}: Props) {
  const hasCompanies = companies.length > 0;

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{hasCompanies ? "Chọn doanh nghiệp để lật CV" : "Bạn chưa có doanh nghiệp"}</DialogTitle>
          <DialogDescription>
            {hasCompanies
              ? "Lượt lật CV sẽ được tính theo doanh nghiệp bạn chọn."
              : "Bạn cần tạo doanh nghiệp trước khi sử dụng tính năng lật CV."}
          </DialogDescription>
        </DialogHeader>

        {hasCompanies ? (
          <select
            value={selectedCompanyId}
            onChange={(e) => onSelectedCompanyIdChange(e.target.value)}
            className="h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm"
          >
            <option value="" disabled>
              Chọn doanh nghiệp
            </option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} ({company.role})
              </option>
            ))}
          </select>
        ) : null}

        <DialogFooter>
          {hasCompanies ? (
            <Button onClick={onConfirm} disabled={!selectedCompanyId}>
              Xác nhận
            </Button>
          ) : (
            <Button onClick={onCreateCompany}>Tạo doanh nghiệp</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
