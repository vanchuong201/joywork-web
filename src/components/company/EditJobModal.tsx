"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@headlessui/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import api from "@/lib/api";
import { X } from "lucide-react";
import DOMPurify from "dompurify";
import TurndownService from "turndown";
import { marked } from "marked";

const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"] as const;
const experienceLevels = ["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"] as const;

const schema = z.object({
  title: z.string().min(4, "Tiêu đề tối thiểu 4 ký tự"),
  descriptionMd: z.string().min(10, "Mô tả tối thiểu 10 ký tự"),
  location: z.string().optional().or(z.literal("")),
  remote: z.boolean().optional().default(false),
  employmentType: z.enum(employmentTypes).default("FULL_TIME"),
  experienceLevel: z.enum(experienceLevels).default("MID"),
  salaryMin: z.string().optional().or(z.literal("")).refine((val) => !val || /^\d+$/.test(val), { message: "Lương phải là số" }),
  salaryMax: z.string().optional().or(z.literal("")).refine((val) => !val || /^\d+$/.test(val), { message: "Lương phải là số" }),
  currency: z.string().min(3).max(3).default("VND"),
  applicationDeadline: z.string().optional().or(z.literal("")).refine((val) => !val || !Number.isNaN(Date.parse(val)), {
    message: "Ngày không hợp lệ",
  }),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  onSaved?: () => void;
};

const DESCRIPTION_SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["p","strong","em","u","s","span","a","ul","ol","li","blockquote","code","pre","h1","h2","h3","br","div","img","figure","figcaption"],
  ALLOWED_ATTR: ["href","target","rel","style","class","src","alt","title","width","height","loading"],
};

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

function htmlToMarkdown(html?: string | null) {
  if (!html) return "";
  try {
    return turndown.turndown(html);
  } catch {
    return html ?? "";
  }
}

function markdownToHtml(markdown?: string | null) {
  if (!markdown) return "";
  const html = marked.parse(markdown, { breaks: true });
  return typeof html === "string" ? html : "";
}

function sanitizeHtmlFromMarkdown(markdown: string | undefined | null) {
  if (!markdown) return "";
  const rawHtml = markdownToHtml(markdown);
  const sanitized = DOMPurify.sanitize(rawHtml, DESCRIPTION_SANITIZE_CONFIG as any);
  const normalized = sanitized.replace(/(<p><br><\/p>|\s|&nbsp;)+$/gi, "").trim();
  if (!normalized || normalized === "<p></p>") {
    return "";
  }
  return sanitized;
}

export default function EditJobModal({ isOpen, onClose, jobId, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    trigger,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      title: "",
      descriptionMd: "",
      location: "",
      remote: false,
      employmentType: "FULL_TIME",
      experienceLevel: "MID",
      salaryMin: "",
      salaryMax: "",
      currency: "VND",
      applicationDeadline: "",
    },
  });

  const titleValue = watch("title");
  const descriptionMd = watch("descriptionMd");
  const isFormValid = useMemo(() => {
    const titleOk = (titleValue || "").trim().length >= 4;
    const descOk = (descriptionMd || "").trim().length >= 10;
    const hasErrors = Boolean(errors.title) || Boolean(errors.descriptionMd);
    return titleOk && descOk && !hasErrors;
  }, [titleValue, descriptionMd, errors.title, errors.descriptionMd]);
  const titleRegister = register("title");

  useEffect(() => {
    const fetchJob = async () => {
      if (!isOpen || !jobId) return;
      setLoading(true);
      try {
        const res = await api.get(`/api/jobs/${jobId}`);
        const job = res.data.data.job;
        reset({
          title: job.title ?? "",
          descriptionMd: htmlToMarkdown(job.description ?? ""),
          location: job.location ?? "",
          remote: job.remote ?? false,
          employmentType: job.employmentType ?? "FULL_TIME",
          experienceLevel: job.experienceLevel ?? "MID",
          salaryMin: job.salaryMin ? String(job.salaryMin) : "",
          salaryMax: job.salaryMax ? String(job.salaryMax) : "",
          currency: job.currency ?? "VND",
          applicationDeadline: job.applicationDeadline ? job.applicationDeadline.slice(0, 10) : "",
        });
      } catch (e: any) {
        toast.error(e?.response?.data?.error?.message ?? "Không tải được dữ liệu job");
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [isOpen, jobId, reset, onClose]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const descriptionHtml = sanitizeHtmlFromMarkdown(values.descriptionMd);
      await api.patch(`/api/jobs/${jobId}`, {
        title: values.title.trim(),
        description: descriptionHtml || undefined,
        location: values.location?.trim() || undefined,
        remote: values.remote ?? false,
        employmentType: values.employmentType,
        experienceLevel: values.experienceLevel,
        salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
        salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
        currency: values.currency,
        applicationDeadline: values.applicationDeadline ? new Date(values.applicationDeadline).toISOString() : undefined,
      });
      toast.success("Cập nhật job thành công");
      onSaved?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? "Cập nhật job thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={() => (!isSubmitting ? onClose() : undefined)} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-3xl rounded-xl bg-[var(--card)] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">Chỉnh sửa job</Dialog.Title>
            <button
              onClick={() => (!isSubmitting ? onClose() : undefined)}
              disabled={isSubmitting}
              className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading ? (
            <div className="h-24 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)]" />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Tiêu đề job" error={errors.title?.message} required>
                  <Input
                    placeholder="Ví dụ: Product Manager"
                    {...titleRegister}
                    onChange={(e) => {
                      titleRegister.onChange(e).catch(() => {});
                    }}
                    onBlur={(e) => {
                      titleRegister.onBlur(e).catch(() => {});
                      const v = (e.target.value || "").trim();
                      if (v.length < 4) {
                        setError("title", { type: "manual", message: "Tiêu đề tối thiểu 4 ký tự" });
                      } else {
                        clearErrors("title");
                      }
                    }}
                  />
                </FormField>
                <FormField label="Địa điểm" error={errors.location?.message}>
                  <Input placeholder="Hà Nội / Remote" {...register("location")} />
                </FormField>
              </div>

              <FormField label="Mô tả công việc (JD)" error={errors.descriptionMd?.message} required>
                <RichTextEditor
                  value={descriptionMd}
                  onChange={(v) => {
                    setValue("descriptionMd", (v ?? "").toString(), { shouldDirty: true, shouldTouch: true, shouldValidate: false });
                    trigger("descriptionMd").catch(() => {});
                  }}
                  onBlur={() => {
                    const v = (descriptionMd || "").trim();
                    if (v.length < 10) {
                      setError("descriptionMd", { type: "manual", message: "Mô tả tối thiểu 10 ký tự" });
                    } else {
                      clearErrors("descriptionMd");
                    }
                  }}
                  placeholder="Mô tả nhiệm vụ, yêu cầu, quyền lợi..."
                />
              </FormField>
              <div className="text-xs text-[var(--muted-foreground)]">
                Mẹo: Nhấn Enter để xuống dòng, dùng dấu gạch đầu dòng để liệt kê yêu cầu/quyền lợi.
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Hình thức làm việc">
                  <select
                    {...register("employmentType")}
                    className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    {employmentTypes.map((t) => (
                      <option key={t} value={t}>
                        {t === "FULL_TIME" ? "Toàn thời gian" : t === "PART_TIME" ? "Bán thời gian" : t === "CONTRACT" ? "Hợp đồng" : t === "INTERNSHIP" ? "Thực tập" : t === "FREELANCE" ? "Tự do" : t}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Cấp độ">
                  <select
                    {...register("experienceLevel")}
                    className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                  >
                    {experienceLevels.map((l) => (
                      <option key={l} value={l}>
                        {l === "ENTRY" ? "Mới tốt nghiệp" : l === "JUNIOR" ? "Junior" : l === "MID" ? "Mid" : l === "SENIOR" ? "Senior" : l === "LEAD" ? "Lead" : l === "EXECUTIVE" ? "Executive" : l}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Remote">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" {...register("remote")} />
                    Cho phép làm việc từ xa
                  </label>
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Lương tối thiểu" error={errors.salaryMin?.message}>
                  <Input placeholder="Ví dụ: 15000000" inputMode="numeric" {...register("salaryMin")} />
                </FormField>
                <FormField label="Lương tối đa" error={errors.salaryMax?.message}>
                  <Input placeholder="Ví dụ: 25000000" inputMode="numeric" {...register("salaryMax")} />
                </FormField>
                <FormField label="Đơn vị lương">
                  <Input placeholder="VND" maxLength={3} {...register("currency")} />
                </FormField>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Hạn nộp hồ sơ" error={errors.applicationDeadline?.message}>
                  <Input type="date" {...register("applicationDeadline")} />
                </FormField>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => (!isSubmitting ? onClose() : undefined)} disabled={isSubmitting}>
                  Huỷ
                </Button>
                <Button type="submit" disabled={!isFormValid || isSubmitting}>
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function FormField({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-[var(--foreground)]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}


