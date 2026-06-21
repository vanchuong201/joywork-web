"use client";

import { useRouter } from "next/navigation";
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
  onOpenChange: (open: boolean) => void;
  companies: CvFlipCompanyAccess[];
  draftCompanyId: string;
  onDraftCompanyIdChange: (value: string) => void;
  onConfirm: () => void;
  onCreateCompany?: () => void;
};

export default function CompanySelectorModal({
  open,
  onOpenChange,
  companies,
  draftCompanyId,
  onDraftCompanyIdChange,
  onConfirm,
  onCreateCompany,
}: Props) {
  const router = useRouter();
  const hasCompanies = companies.length > 0;

  function handleGoBack() {
    router.back();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            value={draftCompanyId}
            onChange={onDraftCompanyIdChange}
            companies={companies}
          />
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleGoBack}>
            Quay lại
          </Button>
          {hasCompanies ? (
            <Button onClick={onConfirm} disabled={!draftCompanyId}>
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
