"use client";

import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileUp, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/api";
import { uploadProfileCV } from "@/lib/uploads";
import { applyCvImport, createCvImport } from "@/lib/api/cv-imports";
import { CV_IMPORT_SECTIONS } from "@/types/cv-import";
import type { CvImportJob, CvImportSection, ParsedCv } from "@/types/cv-import";
import type { OwnUserProfile } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Stage = "idle" | "uploading" | "parsing" | "review" | "applying" | "done" | "error";

interface CvGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: OwnUserProfile;
  currentCvUrl: string | null;
  onCvUrlChange: (url: string | null) => void;
}

interface SectionDescriptor {
  section: CvImportSection;
  label: string;
  hasData: boolean;
  preview: string;
}

const SECTION_LABELS: Record<CvImportSection, string> = {
  basicInfo: "Thông tin cơ bản",
  contact: "Thông tin liên hệ",
  skills: "Kỹ năng",
  knowledge: "Kiến thức",
  attitude: "Thái độ",
  careerGoals: "Mục tiêu nghề nghiệp",
  expectations: "Mong muốn công việc",
  experiences: "Kinh nghiệm làm việc",
  educations: "Học vấn",
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const maybeResponse = (error as { response?: { data?: { error?: { message?: string } } } }).response;
    const apiMessage = maybeResponse?.data?.error?.message;
    if (apiMessage) return apiMessage;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function joinNonEmpty(values: Array<string | null | undefined>, separator = " · "): string {
  return values.map((value) => value?.trim()).filter((value): value is string => !!value).join(separator);
}

function buildSectionDescriptors(parsed: ParsedCv | null): SectionDescriptor[] {
  if (!parsed) return [];

  const salary = joinNonEmpty([
    typeof parsed.expectations.expectedSalaryMin === "number"
      ? parsed.expectations.expectedSalaryMin.toLocaleString("vi-VN")
      : null,
    typeof parsed.expectations.expectedSalaryMax === "number"
      ? parsed.expectations.expectedSalaryMax.toLocaleString("vi-VN")
      : null,
  ], " - ");

  const descriptors: SectionDescriptor[] = CV_IMPORT_SECTIONS.map((section) => {
    switch (section) {
      case "basicInfo": {
        const b = parsed.basicInfo;
        const hasData = !!(b.fullName || b.title || b.headline || b.bio || b.gender || b.yearOfBirth);
        return {
          section,
          label: SECTION_LABELS[section],
          hasData,
          preview: joinNonEmpty([b.fullName, b.title, b.headline, b.yearOfBirth ? `Năm sinh ${b.yearOfBirth}` : null]),
        };
      }
      case "contact": {
        const c = parsed.contact;
        const hasData = !!(c.contactEmail || c.contactPhone || c.website || c.linkedin || c.github);
        return {
          section,
          label: SECTION_LABELS[section],
          hasData,
          preview: joinNonEmpty([c.contactEmail, c.contactPhone, c.website, c.linkedin, c.github]),
        };
      }
      case "skills":
      case "knowledge":
      case "attitude":
      case "careerGoals": {
        const items = parsed[section];
        return {
          section,
          label: SECTION_LABELS[section],
          hasData: items.length > 0,
          preview: items.slice(0, 6).join(", ") + (items.length > 6 ? "…" : ""),
        };
      }
      case "expectations": {
        const e = parsed.expectations;
        const hasData = !!(
          typeof e.expectedSalaryMin === "number" ||
          typeof e.expectedSalaryMax === "number" ||
          e.salaryCurrency ||
          e.workMode
        );
        return {
          section,
          label: SECTION_LABELS[section],
          hasData,
          preview: joinNonEmpty([salary ? `${salary} ${e.salaryCurrency ?? ""}`.trim() : null, e.workMode]),
        };
      }
      case "experiences": {
        const items = parsed.experiences;
        const first = items[0];
        return {
          section,
          label: SECTION_LABELS[section],
          hasData: items.length > 0,
          preview: first ? joinNonEmpty([first.role, first.company, first.period]) : "",
        };
      }
      case "educations": {
        const items = parsed.educations;
        const first = items[0];
        return {
          section,
          label: SECTION_LABELS[section],
          hasData: items.length > 0,
          preview: first ? joinNonEmpty([first.degree, first.school, first.period]) : "",
        };
      }
      default:
        return { section, label: SECTION_LABELS[section], hasData: false, preview: "" };
    }
  });

  return descriptors;
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
  const [parsedJob, setParsedJob] = useState<CvImportJob | null>(null);
  const [selectedSections, setSelectedSections] = useState<CvImportSection[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [appliedMode, setAppliedMode] = useState<"fill_missing" | "overwrite">("fill_missing");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProcessing = stage === "uploading" || stage === "parsing" || stage === "applying";

  const sectionDescriptors = useMemo(
    () => buildSectionDescriptors(parsedJob?.parsedData ?? null),
    [parsedJob]
  );
  const availableSections = useMemo(
    () => sectionDescriptors.filter((descriptor) => descriptor.hasData),
    [sectionDescriptors]
  );

  const progressValue = useMemo(() => {
    if (stage === "idle") return 0;
    if (stage === "uploading") return 25;
    if (stage === "parsing") return 55;
    if (stage === "review") return 70;
    if (stage === "applying") return 90;
    if (stage === "done") return 100;
    return 0;
  }, [stage]);

  const resetState = () => {
    setStage("idle");
    setErrorMessage(null);
    setJobWarnings([]);
    setParsedJob(null);
    setSelectedSections([]);
    setOverwrite(false);
    setAppliedMode("fill_missing");
  };

  const closeDialog = () => {
    if (isProcessing) return;
    onOpenChange(false);
    resetState();
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

  const toggleSection = (section: CvImportSection) => {
    setSelectedSections((prev) =>
      prev.includes(section) ? prev.filter((item) => item !== section) : [...prev, section]
    );
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
    setParsedJob(null);

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

      const descriptors = buildSectionDescriptors(importJob.parsedData ?? null);
      const withData = descriptors.filter((descriptor) => descriptor.hasData).map((d) => d.section);

      setParsedJob(importJob);
      setJobWarnings(importJob.warnings || []);
      setSelectedSections(withData);
      setOverwrite(false);

      if (withData.length === 0) {
        setStage("review");
        return;
      }

      setStage("review");
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Không thể xử lý CV.");
      setErrorMessage(message);
      setStage("error");
      toast.error(message);
    }
  };

  const handleApply = async () => {
    if (!parsedJob) return;
    if (selectedSections.length === 0) {
      toast.error("Chọn ít nhất một mục để áp dụng");
      return;
    }

    const mode = overwrite ? "overwrite" : "fill_missing";
    setStage("applying");
    setErrorMessage(null);

    try {
      const applied = await applyCvImport(parsedJob.id, {
        mode,
        sections: selectedSections,
      });

      if (applied.status === "FAILED") {
        throw new Error(applied.errorMessage || "Không thể áp dụng dữ liệu từ CV.");
      }

      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
      setAppliedMode(mode);
      setStage("done");
      toast.success(
        mode === "overwrite"
          ? "Đã áp dụng dữ liệu từ CV và ghi đè các mục đã chọn."
          : "Đã điền dữ liệu từ CV vào các mục còn trống."
      );
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Không thể áp dụng dữ liệu từ CV.");
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
          <DialogTitle>Tải lên file CV để tự động điền hồ sơ của bạn</DialogTitle>
        </DialogHeader>

        <div className="-mr-2 min-h-0 flex-1 space-y-4 overflow-y-auto pr-2">
          {showDropzone && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted-foreground)]">
                Chấp nhận PDF, DOC, DOCX (tối đa 10MB). Sau khi phân tích, bạn sẽ xem trước và chọn dữ liệu muốn áp dụng.
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
          )}

          {(stage === "uploading" || stage === "parsing" || stage === "applying") && (
            <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
                <div className="h-full bg-[var(--brand)] transition-all" style={{ width: `${progressValue}%` }} />
              </div>
              <p className="text-xs text-[var(--muted-foreground)]">{stageText}</p>
            </div>
          )}

          {(stage === "review" || stage === "applying") && parsedJob && (
            <div className="space-y-4">
              {jobWarnings.length > 0 && (
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

              {availableSections.length === 0 ? (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-4 text-sm text-[var(--muted-foreground)]">
                  Không trích xuất được dữ liệu nào từ CV này. Vui lòng thử file rõ nét hơn hoặc nhập tay.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-[var(--foreground)]">Ghi đè dữ liệu đã có</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {overwrite
                          ? "Sẽ thay thế dữ liệu hiện tại ở các mục đã chọn bằng dữ liệu từ CV."
                          : "Chỉ điền vào các mục còn trống, giữ nguyên dữ liệu bạn đã nhập."}
                      </p>
                    </div>
                    <Switch checked={overwrite} onCheckedChange={setOverwrite} disabled={stage === "applying"} />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-[var(--foreground)]">Chọn dữ liệu áp dụng</p>
                    <div className="space-y-2">
                      {sectionDescriptors
                        .filter((descriptor) => descriptor.hasData)
                        .map((descriptor) => {
                          const checked = selectedSections.includes(descriptor.section);
                          return (
                            <div
                              key={descriptor.section}
                              className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border)] p-3"
                            >
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-[var(--foreground)]">
                                    {descriptor.label}
                                  </span>
                                  <Badge variant="secondary">Có dữ liệu</Badge>
                                </div>
                                {descriptor.preview && (
                                  <p className="truncate text-xs text-[var(--muted-foreground)]">
                                    {descriptor.preview}
                                  </p>
                                )}
                              </div>
                              <Switch
                                checked={checked}
                                onCheckedChange={() => toggleSection(descriptor.section)}
                                disabled={stage === "applying"}
                              />
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {stage === "done" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">Đã cập nhật hồ sơ từ CV thành công.</p>
                  <p className="text-xs">
                    {appliedMode === "overwrite"
                      ? "JOYWORK đã ghi đè các mục bạn chọn bằng dữ liệu từ CV."
                      : "JOYWORK đã điền dữ liệu từ CV vào các mục còn trống."}
                  </p>
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
          {stage === "review" && availableSections.length > 0 && (
            <Button
              type="button"
              onClick={() => void handleApply()}
              disabled={selectedSections.length === 0}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Áp dụng vào hồ sơ
            </Button>
          )}
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
