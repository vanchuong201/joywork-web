"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { downloadCandidateCvPdf, downloadMyCvPdf } from "@/lib/api/cv-exports";

type CvExportButtonProps = {
  mode: "own" | "candidate";
  slug?: string;
  companyId?: string;
  masked?: boolean;
  onRequireCompanySelect?: () => void;
  label?: string;
} & Omit<ButtonProps, "onClick">;

export default function CvExportButton({
  mode,
  slug,
  companyId,
  masked = false,
  onRequireCompanySelect,
  label,
  disabled,
  variant = "outline",
  size = "default",
  className,
}: CvExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const resolveLabel = () => {
    if (label) return label;
    if (isExporting) return "Đang xuất PDF...";
    if (mode === "own") return "Xuất CV PDF";
    if (masked) return "Xuất PDF (ẩn liên hệ)";
    return "Xuất PDF";
  };

  const handleExport = async () => {
    if (isExporting) return;

    if (mode === "candidate") {
      if (!slug) {
        toast.error("Không xác định được hồ sơ cần xuất.");
        return;
      }
      if (!companyId) {
        onRequireCompanySelect?.();
        return;
      }
    }

    setIsExporting(true);
    try {
      if (mode === "own") {
        await downloadMyCvPdf();
      } else {
        const candidateSlug = slug ?? "";
        const selectedCompanyId = companyId ?? "";
        await downloadCandidateCvPdf(candidateSlug, selectedCompanyId, masked);
      }
      toast.success("Đã xuất CV PDF thành công.");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể xuất CV PDF lúc này.";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || isExporting}
      onClick={handleExport}
    >
      <Download className="mr-2 h-4 w-4" />
      {resolveLabel()}
    </Button>
  );
}
