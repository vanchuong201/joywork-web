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
import CompanySelect from "./CompanySelect";

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
          <DialogTitle>{hasCompanies ? "Chọn doanh nghiệp để mở CV" : "Bạn chưa có doanh nghiệp"}</DialogTitle>
          <DialogDescription>
            {hasCompanies
              ? "Lượt mở CV sẽ được tính theo doanh nghiệp bạn chọn."
              : "Bạn cần tạo doanh nghiệp trước khi sử dụng tính năng mở CV."}
          </DialogDescription>
        </DialogHeader>

        {hasCompanies ? (
          <CompanySelect
            value={selectedCompanyId}
            onChange={onSelectedCompanyIdChange}
            companies={companies}
          />
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
