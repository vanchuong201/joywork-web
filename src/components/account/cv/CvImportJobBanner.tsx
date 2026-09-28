"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getCvImport } from "@/lib/api/cv-imports";
import type { CvImportStatus } from "@/types/cv-import";

const CV_JOB_POLL_INTERVAL_MS = 3000;
const CV_JOB_POLL_MAX_ATTEMPTS = 60;

/** Theo dõi phiên import CV qua `?cvJob=` (onboarding) và báo khi CV đã được cập nhật. */
export default function CvImportJobBanner({ onApplied }: { onApplied: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cvJobId = searchParams.get("cvJob");
  const [cvJobStatus, setCvJobStatus] = useState<CvImportStatus | null>(null);
  const [cvJobError, setCvJobError] = useState<string | null>(null);
  const [cvJobPollAttempts, setCvJobPollAttempts] = useState(0);
  const [isCheckingCvJob, setIsCheckingCvJob] = useState(false);

  const clearCvJobQueryParam = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cvJob");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }, [router, pathname, searchParams]);

  const checkCvJob = useCallback(async (): Promise<CvImportStatus | null> => {
    if (!cvJobId) return null;
    setIsCheckingCvJob(true);
    try {
      const job = await getCvImport(cvJobId);
      setCvJobStatus(job.status);
      setCvJobError(job.errorMessage ?? null);
      return job.status;
    } catch {
      setCvJobError("Không thể kiểm tra trạng thái xử lý CV. Vui lòng thử lại.");
      return null;
    } finally {
      setIsCheckingCvJob(false);
    }
  }, [cvJobId]);

  useEffect(() => {
    if (!cvJobId) {
      setCvJobStatus(null);
      setCvJobError(null);
      setCvJobPollAttempts(0);
      return;
    }
    setCvJobPollAttempts(0);
    void checkCvJob();
  }, [cvJobId, checkCvJob]);

  const isCvJobRunning =
    !!cvJobId &&
    (cvJobStatus === null ||
      cvJobStatus === "PENDING" ||
      cvJobStatus === "PROCESSING" ||
      cvJobStatus === "READY");
  const isCvJobTimedOut = isCvJobRunning && cvJobPollAttempts >= CV_JOB_POLL_MAX_ATTEMPTS;

  useEffect(() => {
    if (!cvJobId || !isCvJobRunning || isCvJobTimedOut) return;

    const timer = window.setTimeout(() => {
      setCvJobPollAttempts((prev) => prev + 1);
      void checkCvJob();
    }, CV_JOB_POLL_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [cvJobId, isCvJobRunning, isCvJobTimedOut, cvJobPollAttempts, checkCvJob]);

  useEffect(() => {
    if (cvJobStatus !== "APPLIED" || !cvJobId) return;
    setCvJobStatus(null);
    onApplied();
    clearCvJobQueryParam();
    toast.success("CV đã được cập nhật từ file của bạn.");
  }, [cvJobStatus, cvJobId, onApplied, clearCvJobQueryParam]);

  if (!cvJobId) return null;

  const retryButton = (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        setCvJobPollAttempts(0);
        void checkCvJob();
      }}
    >
      Tải lại trạng thái
    </Button>
  );

  if (cvJobStatus === "FAILED") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-medium">Không thể tự động tạo CV từ file.</p>
            <p className="text-xs">
              {cvJobError || "Vui lòng kiểm tra lại link CV hoặc tải file PDF/DOCX để tạo CV thủ công."}
            </p>
            <div className="mt-2">{retryButton}</div>
          </div>
        </div>
      </div>
    );
  }

  if (isCvJobTimedOut) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Quá trình tạo CV đang lâu hơn dự kiến. Bạn có thể tải lại trạng thái hoặc tiếp tục chỉnh sửa CV thủ công.
        <div className="mt-2">{retryButton}</div>
      </div>
    );
  }

  if (!isCvJobRunning) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
      <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
      <div>
        <p className="font-medium">
          {cvJobStatus === "READY"
            ? "CV nháp đã sẵn sàng, hệ thống đang hoàn tất áp dụng vào CV."
            : "Hệ thống đang tạo CV từ file của bạn."}
        </p>
        <p className="text-xs">Trang sẽ tự cập nhật khi hoàn tất.</p>
        {isCheckingCvJob ? <p className="mt-1 text-xs text-blue-800">Đang kiểm tra trạng thái mới nhất...</p> : null}
      </div>
    </div>
  );
}
