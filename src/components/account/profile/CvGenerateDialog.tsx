"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileUp, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { uploadProfileCV } from "@/lib/uploads";
import { applyCvImport, createCvImport, getCvImport } from "@/lib/api/cv-imports";
import { CV_IMPORT_SECTIONS } from "@/types/cv-import";
import { invalidateCandidateCv } from "@/hooks/useCandidateCvs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Stage = "idle" | "uploading" | "parsing" | "applying" | "done" | "error";

type ImportTarget = "new" | "current";

interface CvGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** CV đang sửa — đích khi chọn "Ghi đè CV này". */
  cvId: string;
  /** Còn slot để tạo CV mới từ file. */
  canCreateNewCv: boolean;
  /** Gọi sau khi import tạo CV mới thành công. */
  onCreatedCv?: (cvId: string) => void;
  currentCvUrl: string | null;
  onCvUrlChange: (url: string | null) => void;
  /** Job CV đã parse sẵn (auto từ onboarding) — bỏ qua bước upload */
  initialJobId?: string | null;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const maybeResponse = (error as { response?: { data?: { error?: { message?: string } } } }).response;
    const apiMessage = maybeResponse?.data?.error?.message;
    if (apiMessage) return apiMessage;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function CvGenerateDialog({
  open,
  onOpenChange,
  cvId,
  canCreateNewCv,
  onCreatedCv,
  currentCvUrl,
  onCvUrlChange,
  initialJobId = null,
}: CvGenerateDialogProps) {
  const queryClient = useQueryClient();
  const [importTarget, setImportTarget] = useState<ImportTarget>(canCreateNewCv ? "new" : "current");
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [createdCvId, setCreatedCvId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [jobWarnings, setJobWarnings] = useState<string[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProcessing = stage === "uploading" || stage === "parsing" || stage === "applying";
  const isTargetConfirmed = importTarget === "new" || confirmOverwrite;

  useEffect(() => {
    if (!open) return;
    setImportTarget(canCreateNewCv ? "new" : "current");
    setConfirmOverwrite(false);
    setCreatedCvId(null);
  }, [open, canCreateNewCv]);

  const applyTarget = () =>
    importTarget === "new" ? { createNewCv: true } : { targetCvId: cvId };

  const finishApplied = (appliedCvId?: string) => {
    invalidateCandidateCv(queryClient);
    if (importTarget === "new" && appliedCvId) {
      setCreatedCvId(appliedCvId);
    }
  };

  const progressValue = useMemo(() => {
    if (stage === "idle") return 0;
    if (stage === "uploading") return 30;
    if (stage === "parsing") return 65;
    if (stage === "applying") return 90;
    if (stage === "done") return 100;
    return 0;
  }, [stage]);

  const resetState = () => {
    setStage("idle");
    setErrorMessage(null);
    setJobWarnings([]);
  };

  const closeDialog = () => {
    if (isProcessing) return;
    onOpenChange(false);
    resetState();
    if (createdCvId) onCreatedCv?.(createdCvId);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isProcessing) return;
    if (!nextOpen) {
      closeDialog();
      return;
    }
    onOpenChange(nextOpen);
  };

  const extractS3Key = (url: string): string | undefined => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 3) {
        return pathParts.slice(2).join("/");
      }
    } catch {
      return undefined;
    }
    return undefined;
  };

  const applyExistingJob = async (jobId: string) => {
    setStage("applying");
    setErrorMessage(null);
    try {
      const job = await getCvImport(jobId);
      if (job.status === "FAILED") {
        throw new Error(job.errorMessage || "Không thể đọc CV từ link.");
      }
      if (job.status !== "READY" && job.status !== "APPLIED") {
        throw new Error("CV nháp chưa sẵn sàng. Vui lòng thử lại sau giây lát.");
      }

      setJobWarnings(job.warnings || []);

      let appliedCvId: string | undefined;
      if (job.status === "READY") {
        const applied = await applyCvImport(jobId, {
          mode: "overwrite",
          sections: [...CV_IMPORT_SECTIONS],
          ...applyTarget(),
        });
        if (applied.status === "FAILED") {
          throw new Error(applied.errorMessage || "Không thể áp dụng dữ liệu từ CV.");
        }
        appliedCvId = applied.targetCvId;
      }

      finishApplied(appliedCvId);
      setStage("done");
      toast.success("Đã áp dụng CV nháp vào hồ sơ của bạn.");
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Không thể áp dụng CV nháp.");
      setErrorMessage(message);
      setStage("error");
      toast.error(message);
    }
  };

  const handleFileUploadAndGenerate = async (file: File) => {
    setIsDraggingFile(false);
    if (!isTargetConfirmed) {
      toast.error("Vui lòng xác nhận ghi đè CV này trước khi tải file lên");
      return;
    }

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast.error("Chỉ chấp nhận file PDF, DOC hoặc DOCX");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File CV vượt quá giới hạn 10MB");
      return;
    }

    setStage("uploading");
    setErrorMessage(null);
    setJobWarnings([]);

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploadResult = await uploadProfileCV({
        fileName: file.name,
        fileType: file.type,
        fileData: base64.split(",")[1],
        ...(importTarget === "new"
          ? { attach: false }
          : {
              cvId,
              previousKey: currentCvUrl ? extractS3Key(currentCvUrl) : undefined,
            }),
      });

      if (importTarget === "current") {
        onCvUrlChange(uploadResult.assetUrl);
        invalidateCandidateCv(queryClient, cvId);
      }

      setStage("parsing");
      const importJob = await createCvImport({ cvUrl: uploadResult.assetUrl });
      if (importJob.status === "FAILED") {
        throw new Error(importJob.errorMessage || "Không thể đọc CV vào lúc này.");
      }

      setJobWarnings(importJob.warnings || []);

      setStage("applying");
      const applied = await applyCvImport(importJob.id, {
        mode: "overwrite",
        sections: [...CV_IMPORT_SECTIONS],
        ...applyTarget(),
      });

      if (applied.status === "FAILED") {
        throw new Error(applied.errorMessage || "Không thể áp dụng dữ liệu từ CV.");
      }

      finishApplied(applied.targetCvId);
      setStage("done");
      toast.success(
        importTarget === "new"
          ? "Đã tạo CV mới từ file CV của bạn."
          : "Đã cập nhật CV này bằng thông tin trích xuất từ file."
      );
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Không thể xử lý CV.");
      setErrorMessage(message);
      setStage("error");
      toast.error(message);
    }
  };

  const stageText =
    stage === "uploading"
      ? "Đang tải CV lên hệ thống..."
      : stage === "parsing"
        ? "JOYWORK đang phân tích nội dung CV..."
        : stage === "applying"
          ? "Đang điền dữ liệu vào hồ sơ của bạn..."
          : "";

  const showDropzone = stage === "idle" || stage === "uploading" || stage === "parsing";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] max-w-2xl flex-col overflow-hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {initialJobId
              ? "Xem & hoàn thiện CV nháp từ link import"
              : "Tải lên file CV để tự động điền CV"}
          </DialogTitle>
        </DialogHeader>

        <div className="-mr-2 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
          {initialJobId && (stage === "idle" || stage === "error") ? (
            <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-sm text-[var(--muted-foreground)]">
                Hệ thống đã tạo CV nháp từ link trong dữ liệu import. Bạn có thể áp dụng vào hồ sơ ngay,
                hoặc tải lên file CV khác bên dưới.
              </p>
              <Button
                onClick={() => void applyExistingJob(initialJobId)}
                disabled={isProcessing}
              >
                <Wand2 className="h-4 w-4" />
                Áp dụng CV nháp vào hồ sơ
              </Button>
              {errorMessage ? <p className="text-sm text-red-500">{errorMessage}</p> : null}
            </div>
          ) : null}

          {showDropzone && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted-foreground)]">
                Chấp nhận PDF, DOC, DOCX (tối đa 10MB). Sau khi phân tích, hệ thống sẽ tự động điền dữ liệu từ file CV.
              </p>

              <fieldset className="space-y-2" disabled={isProcessing}>
                <legend className="text-sm font-medium text-[var(--foreground)]">Dữ liệu từ file sẽ được đưa vào</legend>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm",
                    importTarget === "new" ? "border-[var(--brand)]" : "border-[var(--border)]",
                    !canCreateNewCv && "cursor-not-allowed opacity-60"
                  )}
                >
                  <input
                    type="radio"
                    name="cv-import-target"
                    className="mt-1"
                    checked={importTarget === "new"}
                    disabled={!canCreateNewCv}
                    onChange={() => setImportTarget("new")}
                  />
                  <span>
                    <span className="block font-medium">Tạo CV mới từ file</span>
                    <span className="block text-xs text-[var(--muted-foreground)]">
                      {canCreateNewCv
                        ? "CV hiện tại giữ nguyên, hệ thống tạo thêm một CV mới."
                        : "Bạn đã đạt giới hạn 5 CV. Xóa bớt CV để tạo mới."}
                    </span>
                  </span>
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm",
                    importTarget === "current" ? "border-[var(--brand)]" : "border-[var(--border)]"
                  )}
                >
                  <input
                    type="radio"
                    name="cv-import-target"
                    className="mt-1"
                    checked={importTarget === "current"}
                    onChange={() => setImportTarget("current")}
                  />
                  <span>
                    <span className="block font-medium">Ghi đè CV này</span>
                    <span className="block text-xs text-[var(--muted-foreground)]">
                      Thông tin cơ bản, liên hệ, kỹ năng, kinh nghiệm và học vấn của CV đang sửa sẽ bị thay thế.
                    </span>
                  </span>
                </label>
              </fieldset>

              {importTarget === "current" && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <label className="flex cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={confirmOverwrite}
                      disabled={isProcessing}
                      onChange={(e) => setConfirmOverwrite(e.target.checked)}
                    />
                    <span className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>Tôi hiểu nội dung hiện tại của CV này sẽ bị ghi đè và không thể hoàn tác.</span>
                    </span>
                  </label>
                </div>
              )}

              <input
                ref={fileInputRef}
                id="cv-generate-file-input"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileUploadAndGenerate(file);
                  e.target.value = "";
                }}
              />

              <div
                role="button"
                tabIndex={isProcessing || !isTargetConfirmed ? -1 : 0}
                aria-disabled={isProcessing || !isTargetConfirmed}
                onClick={() => {
                  if (isProcessing || !isTargetConfirmed) return;
                  fileInputRef.current?.click();
                }}
                onKeyDown={(e) => {
                  if (isProcessing || !isTargetConfirmed) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (isProcessing || !isTargetConfirmed) return;
                  setIsDraggingFile(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setIsDraggingFile(false);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (isProcessing || !isTargetConfirmed) return;
                  const file = e.dataTransfer.files?.[0];
                  if (file) void handleFileUploadAndGenerate(file);
                }}
                className={cn(
                  "rounded-xl border border-dashed p-6 transition-all outline-none",
                  isProcessing || !isTargetConfirmed
                    ? "cursor-not-allowed border-[var(--border)] bg-[var(--muted)]/20 opacity-80"
                    : isDraggingFile
                      ? "border-[var(--brand)] bg-[var(--brand-light,_#eef4ff)] shadow-sm"
                      : "cursor-pointer border-[var(--border)] bg-white hover:border-[var(--brand)]/50 hover:bg-[var(--muted)]/20"
                )}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full",
                      isDraggingFile ? "bg-[var(--brand)] text-white" : "bg-[var(--muted)] text-[var(--brand)]"
                    )}
                  >
                    {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <FileUp className="h-6 w-6" />}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {isProcessing ? "Đang xử lý CV của bạn..." : "Kéo & thả file CV vào đây"}
                    </p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      {isProcessing ? stageText || "Vui lòng chờ trong giây lát." : "Hoặc bấm để chọn file từ máy tính"}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={isProcessing || !isTargetConfirmed}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Chọn file từ máy
                  </Button>

                  <p className="text-xs text-[var(--muted-foreground)]">
                    Hỗ trợ PDF, DOC, DOCX. Dung lượng tối đa 10MB.
                  </p>
                </div>
              </div>
            </div>
          )}

          {(stage === "uploading" || stage === "parsing" || stage === "applying") && (
            <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
                <div className="h-full bg-[var(--brand)] transition-all" style={{ width: `${progressValue}%` }} />
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">{stageText}</p>
            </div>
          )}

          {stage === "applying" && jobWarnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <ul className="list-disc space-y-0.5 pl-4 text-xs">
                  {jobWarnings.map((warning, index) => (
                    <li key={`warning-${index}`}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {stage === "done" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">
                    {importTarget === "new" ? "Đã tạo CV mới từ file thành công." : "Đã cập nhật CV từ file thành công."}
                  </p>
                  <p className="text-xs">
                    {importTarget === "new"
                      ? "Bấm \"Hoàn tất\" để mở CV mới và kiểm tra lại thông tin."
                      : "JOYWORK đã ghi đè dữ liệu cũ của CV này bằng thông tin trích xuất từ file."}
                  </p>
                  {jobWarnings.length > 0 && (
                    <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs">
                      {jobWarnings.map((warning, index) => (
                        <li key={`done-warning-${index}`}>{warning}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {stage === "error" && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Không thể xử lý CV.</p>
                  <p className="text-xs">{errorMessage || "Đã xảy ra lỗi, vui lòng thử lại."}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md border border-[var(--border)] bg-[var(--muted)]/20 p-3 text-xs text-[var(--muted-foreground)]">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>
                Dữ liệu AI trích xuất có thể chưa chính xác 100%. Bạn có thể kiểm tra và chỉnh sửa lại trong hồ sơ sau khi hoàn tất.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          {stage === "error" && (
            <Button
              type="button"
              variant="outline"
              onClick={resetState}
              disabled={isProcessing}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          )}
          <Button type="button" variant="outline" onClick={closeDialog} disabled={isProcessing}>
            {stage === "done" ? "Hoàn tất" : "Đóng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
