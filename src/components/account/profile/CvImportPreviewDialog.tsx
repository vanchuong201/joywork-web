"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CV_IMPORT_SECTIONS,
  type CvImportApplyMode,
  type CvImportJob,
  type CvImportSection,
} from "@/types/cv-import";
import {
  applyCvImport,
  createCvImport,
  getCvImport,
} from "@/lib/api/cv-imports";
import type { OwnUserProfile } from "@/types/user";

interface CvImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvUrl: string;
  profile: OwnUserProfile;
}

const SECTION_LABELS: Record<CvImportSection, string> = {
  basicInfo: "Thông tin cơ bản",
  contact: "Thông tin liên hệ",
  skills: "Kỹ năng",
  knowledge: "Kiến thức (K)",
  attitude: "Thái độ (A)",
  careerGoals: "Mục tiêu nghề nghiệp",
  expectations: "Mong muốn công việc",
  experiences: "Kinh nghiệm làm việc",
  educations: "Học vấn",
};

function getCurrentSectionPreview(
  section: CvImportSection,
  profile: OwnUserProfile
): string[] {
  const p = profile.profile;
  switch (section) {
    case "basicInfo":
      return [
        p?.fullName ? `Họ tên: ${p.fullName}` : "Họ tên: (trống)",
        p?.title ? `Vị trí ứng tuyển: ${p.title}` : "Vị trí ứng tuyển: (trống)",
        p?.headline ? `Mô tả ngắn: ${p.headline}` : "Mô tả ngắn: (trống)",
        p?.bio ? `Giới thiệu: ${p.bio.slice(0, 160)}${p.bio.length > 160 ? "…" : ""}` : "Giới thiệu: (trống)",
      ];
    case "contact":
      return [
        p?.contactEmail ? `Email: ${p.contactEmail}` : "Email: (trống)",
        p?.contactPhone ? `Điện thoại: ${p.contactPhone}` : "Điện thoại: (trống)",
        p?.website ? `Website: ${p.website}` : "Website: (trống)",
        p?.linkedin ? `LinkedIn: ${p.linkedin}` : "LinkedIn: (trống)",
        p?.github ? `GitHub: ${p.github}` : "GitHub: (trống)",
      ];
    case "skills":
      return p?.skills && p.skills.length > 0 ? p.skills : ["(chưa có kỹ năng)"];
    case "knowledge":
      return p?.knowledge && p.knowledge.length > 0 ? p.knowledge : ["(chưa có)"];
    case "attitude":
      return p?.attitude && p.attitude.length > 0 ? p.attitude : ["(chưa có)"];
    case "careerGoals":
      return p?.careerGoals && p.careerGoals.length > 0 ? p.careerGoals : ["(chưa có)"];
    case "expectations":
      return [
        p?.expectedSalaryMin != null ? `Lương min: ${p.expectedSalaryMin}` : "Lương min: (trống)",
        p?.expectedSalaryMax != null ? `Lương max: ${p.expectedSalaryMax}` : "Lương max: (trống)",
        p?.salaryCurrency ? `Đơn vị: ${p.salaryCurrency}` : "Đơn vị: (trống)",
        p?.workMode ? `Hình thức: ${p.workMode}` : "Hình thức: (trống)",
      ];
    case "experiences":
      return profile.experiences && profile.experiences.length > 0
        ? profile.experiences.map((exp) => `${exp.role} – ${exp.company}${exp.period ? ` (${exp.period})` : ""}`)
        : ["(chưa có kinh nghiệm)"];
    case "educations":
      return profile.educations && profile.educations.length > 0
        ? profile.educations.map((edu) => `${edu.degree} – ${edu.school}${edu.period ? ` (${edu.period})` : ""}`)
        : ["(chưa có học vấn)"];
    default:
      return [];
  }
}

function getParsedSectionPreview(section: CvImportSection, job: CvImportJob | null): string[] {
  if (!job?.parsedData) return [];
  const data = job.parsedData;
  switch (section) {
    case "basicInfo":
      return [
        data.basicInfo.fullName ? `Họ tên: ${data.basicInfo.fullName}` : "Họ tên: (AI không trích được)",
        data.basicInfo.title ? `Vị trí ứng tuyển: ${data.basicInfo.title}` : "Vị trí ứng tuyển: (—)",
        data.basicInfo.headline ? `Mô tả ngắn: ${data.basicInfo.headline}` : "Mô tả ngắn: (—)",
        data.basicInfo.bio
          ? `Giới thiệu: ${data.basicInfo.bio.slice(0, 160)}${data.basicInfo.bio.length > 160 ? "…" : ""}`
          : "Giới thiệu: (—)",
      ];
    case "contact":
      return [
        data.contact.contactEmail ? `Email: ${data.contact.contactEmail}` : "Email: (—)",
        data.contact.contactPhone ? `Điện thoại: ${data.contact.contactPhone}` : "Điện thoại: (—)",
        data.contact.website ? `Website: ${data.contact.website}` : "Website: (—)",
        data.contact.linkedin ? `LinkedIn: ${data.contact.linkedin}` : "LinkedIn: (—)",
        data.contact.github ? `GitHub: ${data.contact.github}` : "GitHub: (—)",
      ];
    case "skills":
      return data.skills.length > 0 ? data.skills : ["(AI không tìm thấy kỹ năng)"];
    case "knowledge":
      return data.knowledge.length > 0 ? data.knowledge : ["(không có)"];
    case "attitude":
      return data.attitude.length > 0 ? data.attitude : ["(không có)"];
    case "careerGoals":
      return data.careerGoals.length > 0 ? data.careerGoals : ["(không có)"];
    case "expectations":
      return [
        data.expectations.expectedSalaryMin != null ? `Lương min: ${data.expectations.expectedSalaryMin}` : "Lương min: (—)",
        data.expectations.expectedSalaryMax != null ? `Lương max: ${data.expectations.expectedSalaryMax}` : "Lương max: (—)",
        data.expectations.salaryCurrency ? `Đơn vị: ${data.expectations.salaryCurrency}` : "Đơn vị: (—)",
        data.expectations.workMode ? `Hình thức: ${data.expectations.workMode}` : "Hình thức: (—)",
      ];
    case "experiences":
      return data.experiences.length > 0
        ? data.experiences.map((exp) => {
            const period = exp.period ?? [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
            return `${exp.role ?? "(thiếu chức danh)"} – ${exp.company ?? "(thiếu công ty)"}${period ? ` (${period})` : ""}`;
          })
        : ["(AI không trích được kinh nghiệm)"];
    case "educations":
      return data.educations.length > 0
        ? data.educations.map((edu) => {
            const period = edu.period ?? [edu.startDate, edu.endDate].filter(Boolean).join(" – ");
            return `${edu.degree ?? "(thiếu bằng cấp)"} – ${edu.school ?? "(thiếu trường)"}${period ? ` (${period})` : ""}`;
          })
        : ["(AI không trích được học vấn)"];
    default:
      return [];
  }
}

function isSectionEmptyInProfile(section: CvImportSection, profile: OwnUserProfile): boolean {
  const p = profile.profile;
  switch (section) {
    case "basicInfo":
      return !(p?.fullName || p?.title || p?.headline || p?.bio);
    case "contact":
      return !(p?.contactEmail || p?.contactPhone || p?.website || p?.linkedin || p?.github);
    case "skills":
      return !p?.skills || p.skills.length === 0;
    case "knowledge":
      return !p?.knowledge || p.knowledge.length === 0;
    case "attitude":
      return !p?.attitude || p.attitude.length === 0;
    case "careerGoals":
      return !p?.careerGoals || p.careerGoals.length === 0;
    case "expectations":
      return !(p?.expectedSalaryMin != null || p?.expectedSalaryMax != null || p?.salaryCurrency || p?.workMode);
    case "experiences":
      return !profile.experiences || profile.experiences.length === 0;
    case "educations":
      return !profile.educations || profile.educations.length === 0;
    default:
      return true;
  }
}

function isSectionPresentInParsed(section: CvImportSection, job: CvImportJob | null): boolean {
  if (!job?.parsedData) return false;
  const data = job.parsedData;
  switch (section) {
    case "basicInfo":
      return Boolean(
        data.basicInfo.fullName || data.basicInfo.title || data.basicInfo.headline || data.basicInfo.bio
      );
    case "contact":
      return Boolean(
        data.contact.contactEmail || data.contact.contactPhone || data.contact.website || data.contact.linkedin || data.contact.github
      );
    case "skills":
      return data.skills.length > 0;
    case "knowledge":
      return data.knowledge.length > 0;
    case "attitude":
      return data.attitude.length > 0;
    case "careerGoals":
      return data.careerGoals.length > 0;
    case "expectations":
      return Boolean(
        data.expectations.expectedSalaryMin != null ||
          data.expectations.expectedSalaryMax != null ||
          data.expectations.salaryCurrency ||
          data.expectations.workMode
      );
    case "experiences":
      return data.experiences.length > 0;
    case "educations":
      return data.educations.length > 0;
    default:
      return false;
  }
}

export default function CvImportPreviewDialog({
  open,
  onOpenChange,
  cvUrl,
  profile,
}: CvImportPreviewDialogProps) {
  const queryClient = useQueryClient();
  const [job, setJob] = useState<CvImportJob | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [mode, setMode] = useState<CvImportApplyMode>("fill_missing");
  const [selectedSections, setSelectedSections] = useState<Set<CvImportSection>>(new Set());

  useEffect(() => {
    if (!open) {
      setJob(null);
      setIsInitializing(false);
      setMode("fill_missing");
      setSelectedSections(new Set());
      return;
    }

    let cancelled = false;
    const start = async () => {
      setIsInitializing(true);
      try {
        const created = await createCvImport({ cvUrl });
        if (cancelled) return;
        let current = created;
        if (current.status === "PROCESSING" || current.status === "PENDING") {
          // MVP backend xử lý đồng bộ, nhưng vẫn refetch để chắc chắn READY.
          current = await getCvImport(current.id);
        }
        if (cancelled) return;
        setJob(current);

        if (current.status === "READY") {
          const defaultSections: CvImportSection[] = CV_IMPORT_SECTIONS.filter((section) =>
            isSectionPresentInParsed(section, current)
          );
          setSelectedSections(new Set(defaultSections));
        }
      } catch (error) {
        if (cancelled) return;
        const message =
          (error as { response?: { data?: { error?: { message?: string } } }; message?: string })?.response?.data
            ?.error?.message ||
          (error as Error)?.message ||
          "Không thể đọc CV vào lúc này. Vui lòng thử lại.";
        toast.error(message);
        onOpenChange(false);
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };
    void start();

    return () => {
      cancelled = true;
    };
  }, [open, cvUrl, onOpenChange]);

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!job) throw new Error("Không có dữ liệu để áp dụng");
      const sections = Array.from(selectedSections);
      if (sections.length === 0) throw new Error("Hãy chọn ít nhất một mục để áp dụng");
      return applyCvImport(job.id, { mode, sections });
    },
    onSuccess: () => {
      toast.success("Đã cập nhật hồ sơ từ CV.");
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } }; message?: string })?.response?.data
          ?.error?.message ||
        (error as Error)?.message ||
        "Áp dụng thất bại, vui lòng thử lại.";
      toast.error(message);
    },
  });

  const availableSections = useMemo(
    () => CV_IMPORT_SECTIONS.filter((section) => isSectionPresentInParsed(section, job)),
    [job]
  );

  const toggleSection = (section: CvImportSection) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Tạo hồ sơ JoyWork từ CV</DialogTitle>
          <DialogDescription>
            Xem trước dữ liệu JoyWork đã trích xuất từ CV của bạn trước khi cập nhật hồ sơ.
          </DialogDescription>
        </DialogHeader>

        {isInitializing ? (
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              JoyWork đang đọc CV của bạn, có thể mất vài giây...
            </div>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : !job ? (
          <p className="py-6 text-sm text-slate-600">Không có dữ liệu để hiển thị.</p>
        ) : job.status === "FAILED" ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4" />
              Không thể đọc CV
            </div>
            <p className="mt-2">{job.errorMessage || "Hệ thống chưa đọc được CV. Vui lòng thử CV khác."}</p>
          </div>
        ) : job.status === "READY" || job.status === "APPLIED" ? (
          <div className="space-y-4 py-2">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <div className="flex items-center gap-2 font-medium">
                <Info className="h-4 w-4" />
                Hãy kiểm tra kỹ trước khi áp dụng. Dữ liệu AI trích xuất có thể chưa chính xác 100%.
              </div>
              {job.warnings && job.warnings.length > 0 && (
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-xs">
                  {job.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="text-sm font-medium">Chế độ áp dụng</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-md border p-3 text-sm ${
                    mode === "fill_missing"
                      ? "border-[var(--brand)] bg-[var(--brand-light,_#eef4ff)]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="cv-import-mode"
                    value="fill_missing"
                    checked={mode === "fill_missing"}
                    onChange={() => setMode("fill_missing")}
                    className="mr-2"
                  />
                  <span className="font-medium">Điền phần còn thiếu</span>
                  <p className="mt-1 text-xs text-slate-500">
                    Chỉ thêm vào những trường hiện đang trống, không ghi đè dữ liệu bạn đã nhập.
                  </p>
                </label>
                <label
                  className={`cursor-pointer rounded-md border p-3 text-sm ${
                    mode === "overwrite"
                      ? "border-[var(--brand)] bg-[var(--brand-light,_#eef4ff)]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="cv-import-mode"
                    value="overwrite"
                    checked={mode === "overwrite"}
                    onChange={() => setMode("overwrite")}
                    className="mr-2"
                  />
                  <span className="font-medium">Ghi đè các phần đã chọn</span>
                  <p className="mt-1 text-xs text-slate-500">
                    Thay thế nội dung của các mục được chọn bằng dữ liệu từ CV.
                  </p>
                </label>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">Mục cần cập nhật</p>
              <p className="text-xs text-slate-500">
                Bỏ chọn nếu bạn không muốn AI cập nhật phần đó. Chỉ những mục có dữ liệu từ CV mới được hiển thị.
              </p>
              <div className="mt-2 max-h-[40vh] space-y-3 overflow-y-auto pr-2">
                {availableSections.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    AI không trích được mục nào từ CV này. Hãy thử file PDF/DOCX khác.
                  </p>
                ) : (
                  availableSections.map((section) => {
                    const isSelected = selectedSections.has(section);
                    const currentLines = getCurrentSectionPreview(section, profile);
                    const parsedLines = getParsedSectionPreview(section, job);
                    const empty = isSectionEmptyInProfile(section, profile);
                    return (
                      <div
                        key={section}
                        className={`rounded-md border p-3 ${
                          isSelected ? "border-[var(--brand)]" : "border-slate-200"
                        }`}
                      >
                        <label className="flex items-start gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSection(section)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{SECTION_LABELS[section]}</span>
                              {empty ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-700">
                                  <Info className="h-3 w-3" />
                                  Trống
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Đã có
                                </span>
                              )}
                            </div>
                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                              <div>
                                <p className="text-xs font-semibold text-slate-500">Hiện tại</p>
                                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-600">
                                  {currentLines.map((line, idx) => (
                                    <li key={`current-${section}-${idx}`}>{line}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-[var(--brand)]">Từ CV</p>
                                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-700">
                                  {parsedLines.map((line, idx) => (
                                    <li key={`parsed-${section}-${idx}`}>{line}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-6 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang chuẩn bị dữ liệu...
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={applyMutation.isPending}>
            Hủy
          </Button>
          <Button
            type="button"
            disabled={
              applyMutation.isPending ||
              !job ||
              job.status !== "READY" ||
              selectedSections.size === 0
            }
            onClick={() => applyMutation.mutate()}
          >
            {applyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang áp dụng...
              </>
            ) : (
              "Áp dụng vào hồ sơ"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
