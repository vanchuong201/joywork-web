"use client";

import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileUp, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { uploadProfileCV } from "@/lib/uploads";
import { applyCvImport, createCvImport } from "@/lib/api/cv-imports";
import { CV_IMPORT_SECTIONS } from "@/types/cv-import";
import type { OwnUserProfile } from "@/types/user";
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

interface CvGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: OwnUserProfile;
  currentCvUrl: string | null;
  onCvUrlChange: (url: string | null) => void;
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
  currentCvUrl,
  onCvUrlChange,
}: CvGenerateDialogProps) {
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [jobWarnings, setJobWarnings] = useState<string[]>([]);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProcessing = stage === "uploading" || stage === "parsing" || stage === "applying";
  const progressValue = useMemo(() => {
    if (stage === "idle") return 0;
    if (stage === "uploading") return 33;
    if (stage === "parsing") return 66;
    if (stage === "applying") return 90;
    if (stage === "done") return 100;
    return 0;
  }, [stage]);

  const closeDialog = () => {
    if (isProcessing) return;
    onOpenChange(false);
    setStage("idle");
    setErrorMessage(null);
    setJobWarnings([]);
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

  const persistCvUrl = async (nextUrl: string) => {
    await api.patch("/api/users/me/profile", { cvUrl: nextUrl });
    onCvUrlChange(nextUrl);
    queryClient.invalidateQueries({ queryKey: ["own-profile"] });
  };

  const handleFileUploadAndGenerate = async (file: File) => {
    setIsDraggingFile(false);

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
        previousKey: currentCvUrl ? extractS3Key(currentCvUrl) : undefined,
      });

      await persistCvUrl(uploadResult.assetUrl);

      setStage("parsing");
      const importJob = await createCvImport({ cvUrl: uploadResult.assetUrl });
      if (importJob.status === "FAILED") {
        throw new Error(importJob.errorMessage || "Không thể đọc CV vào lúc này.");
      }

      setJobWarnings(importJob.warnings || []);
      setStage("applying");

      const applied = await applyCvImport(importJob.id, {
        mode: "fill_missing",
        sections: [...CV_IMPORT_SECTIONS],
      });

      if (applied.status === "FAILED") {
        throw new Error(applied.errorMessage || "Không thể áp dụng dữ liệu từ CV.");
      }

      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
      setStage("done");
      toast.success("Đã tạo hồ sơ từ file CV và tự động điền phần còn thiếu.");
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-2xl"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Tải lên file CV để tự động điền hồ sơ của bạn</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-[var(--muted-foreground)]">
              Chấp nhận PDF, DOC, DOCX (tối đa 10MB). Sau khi tải lên, hệ thống sẽ tự động tạo hồ sơ từ CV.
            </p>

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
              tabIndex={isProcessing ? -1 : 0}
              onClick={() => {
                if (isProcessing) return;
                fileInputRef.current?.click();
              }}
              onKeyDown={(e) => {
                if (isProcessing) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (isProcessing) return;
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
                if (isProcessing) return;
                const file = e.dataTransfer.files?.[0];
                if (file) void handleFileUploadAndGenerate(file);
              }}
              className={cn(
                "rounded-xl border border-dashed p-6 transition-all outline-none",
                isProcessing
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
                  disabled={isProcessing}
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

          {(isProcessing || stage === "done") && (
            <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className="h-full bg-[var(--brand)] transition-all"
                  style={{ width: `${progressValue}%` }}
                />
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">
                {stage === "done" ? "Hoàn tất. Hồ sơ đã được cập nhật." : stageText}
              </p>
            </div>
          )}

          {stage === "done" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Đã tạo hồ sơ từ CV thành công.</p>
                  <p className="text-xs">JOYWORK đã tự động điền các mục còn thiếu trong hồ sơ của bạn.</p>
                  {jobWarnings.length > 0 && (
                    <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs">
                      {jobWarnings.map((warning, index) => (
                        <li key={`warning-${index}`}>{warning}</li>
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
                  <p className="font-medium">Không thể tạo hồ sơ từ CV.</p>
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
          {stage === "error" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStage("idle");
                setErrorMessage(null);
              }}
              disabled={isProcessing}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={closeDialog} disabled={isProcessing}>
            {stage === "done" ? "Hoàn tất" : "Đóng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
