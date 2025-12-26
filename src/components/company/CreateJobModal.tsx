"use client";

import { useMemo, useState } from "react";
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
import { marked } from "marked";

const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"] as const;
const experienceLevels = ["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"] as const;

const schema = z
  .object({
    title: z
      .string()
      .min(4, "Tiêu đề tối thiểu 4 ký tự")
      .max(200, "Tiêu đề tối đa 200 ký tự"),
    descriptionMd: z
      .string()
      .min(10, "Mô tả tối thiểu 10 ký tự"),
    location: z
      .string()
      .max(100, "Địa điểm tối đa 100 ký tự")
      .optional()
      .or(z.literal("")),
  remote: z.boolean().optional().default(false),
  employmentType: z.enum(employmentTypes).default("FULL_TIME"),
  experienceLevel: z.enum(experienceLevels).default("MID"),
  salaryMin: z
    .string()
    .refine((val) => !val || /^\d+$/.test(val), { message: "Lương phải là số" }),
  salaryMax: z
    .string()
    .refine((val) => !val || /^\d+$/.test(val), { message: "Lương phải là số" }),
    currency: z
      .string()
      .refine((v) => !v || /^[A-Z]{3}$/.test(v), "Mã tiền tệ phải gồm 3 chữ in hoa (VD: VND, USD)"),
  applicationDeadline: z
    .string()
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
      message: "Ngày không hợp lệ",
    }),
  })
  .superRefine((vals, ctx) => {
    // Giới hạn mô tả theo backend (10000 ký tự) - tính theo HTML đã làm sạch tương đối
    const html = sanitizeHtmlFromMarkdown(vals.descriptionMd || "");
    const plain = html.replace(/<[^>]*>/g, "");
    if (plain.length > 10000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["descriptionMd"],
        message: "Mô tả tối đa 10000 ký tự",
      });
    }
    // Ràng buộc lương: min <= max
    const min = vals.salaryMin ? Number(vals.salaryMin) : undefined;
    const max = vals.salaryMax ? Number(vals.salaryMax) : undefined;
    if (typeof min === "number" && typeof max === "number" && !Number.isNaN(min) && !Number.isNaN(max) && min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["salaryMin"],
        message: "Lương tối thiểu không được lớn hơn lương tối đa",
      });
    }
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onSuccess?: () => void;
};

const DESCRIPTION_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "strong",
    "em",
    "u",
    "s",
    "span",
    "a",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "h1",
    "h2",
    "h3",
    "br",
    "div",
    "img",
    "figure",
    "figcaption",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "style", "class", "src", "alt", "title", "width", "height", "loading"],
};

function markdownToHtml(markdown?: string | null) {
  if (!markdown) return "";
  const html = marked.parse(markdown, { breaks: true });
  return typeof html === "string" ? html : "";
}

function sanitizeHtmlFromMarkdown(markdown: string | undefined | null) {
  if (!markdown) return "";
  const rawHtml = markdownToHtml(markdown);
  const sanitized = DOMPurify.sanitize(rawHtml, DESCRIPTION_SANITIZE_CONFIG as any);
  const sanitizedString = typeof sanitized === "string" ? sanitized : sanitized.toString();
  const normalized = sanitizedString.replace(/(<p><br><\/p>|\s|&nbsp;)+$/gi, "").trim();
  if (!normalized || normalized === "<p></p>") {
    return "";
  }
  return sanitizedString;
}

export default function CreateJobModal({ open, onOpenChange, companyId, onSuccess }: Props) {
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
  const currencyRegister = register("currency");
  const salaryMinRegister = register("salaryMin");
  const salaryMaxRegister = register("salaryMax");

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const descriptionHtml = sanitizeHtmlFromMarkdown(values.descriptionMd);
      const payload = {
        title: values.title.trim(),
        description: descriptionHtml || undefined,
        location: values.location?.trim() || undefined,
        remote: values.remote ?? false,
        employmentType: values.employmentType,
        experienceLevel: values.experienceLevel,
        salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
        salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
        currency: values.currency?.trim()
          ? values.currency.trim().toUpperCase()
          : undefined, // bỏ qua để backend dùng mặc định
        applicationDeadline: values.applicationDeadline ? new Date(values.applicationDeadline).toISOString() : undefined,
      };
      await api.post(`/api/jobs/companies/${companyId}/jobs`, payload);
      toast.success("Đăng job mới thành công");
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      const err = error?.response?.data?.error;
      // Map lỗi từ backend (Zod/Fastify) về field
      const details = err?.details;
      let mapped = false;
      let focused = false;
      if (Array.isArray(details)) {
        for (const d of details) {
          const path = Array.isArray(d?.path) ? d.path : Array.isArray(d?.instancePath) ? String(d.instancePath).split("/").filter(Boolean) : [];
          const field = path[0];
          let msg: string = d?.message || err?.message || "Dữ liệu không hợp lệ";
          // Sửa thông điệp dịch sai của backend cho currency
          if (field === "currency" && /Mật khẩu cần ít nhất/i.test(msg)) {
            msg = "Mã tiền tệ phải gồm 3 chữ in hoa (VD: VND, USD)";
          }
          if (field === "title") {
            setError("title", { type: "server", message: msg });
            if (!focused) { (document.querySelector('input[name="title"]') as HTMLInputElement | null)?.focus(); focused = true; }
            mapped = true;
          } else if (field === "description") {
            setError("descriptionMd", { type: "server", message: msg });
            if (!focused) { (document.querySelector('[contenteditable="true"]') as HTMLElement | null)?.focus(); focused = true; }
            mapped = true;
          } else if (field === "location") {
            setError("location", { type: "server", message: msg });
            mapped = true;
          } else if (field === "salaryMin") {
            setError("salaryMin", { type: "server", message: msg });
            mapped = true;
          } else if (field === "salaryMax") {
            setError("salaryMax", { type: "server", message: msg });
            mapped = true;
          } else if (field === "currency") {
            setError("currency", { type: "server", message: msg });
            if (!focused) { (document.querySelector('input[name="currency"]') as HTMLInputElement | null)?.focus(); focused = true; }
            mapped = true;
          } else if (field === "applicationDeadline") {
            setError("applicationDeadline", { type: "server", message: msg });
            mapped = true;
          }
        }
      }
      if (!mapped) {
        const message = err?.message ?? "Đăng job thất bại, vui lòng thử lại";
      toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onOpenChange(false);
    }
  };

  const translateEmploymentType = (t: (typeof employmentTypes)[number]) => {
    switch (t) {
      case "FULL_TIME":
        return "Toàn thời gian";
      case "PART_TIME":
        return "Bán thời gian";
      case "CONTRACT":
        return "Hợp đồng";
      case "INTERNSHIP":
        return "Thực tập";
      case "FREELANCE":
        return "Tự do";
      default:
        return t;
    }
  };

  const translateExperienceLevel = (l: (typeof experienceLevels)[number]) => {
    switch (l) {
      case "ENTRY":
        return "Mới tốt nghiệp";
      case "JUNIOR":
        return "Junior";
      case "MID":
        return "Mid";
      case "SENIOR":
        return "Senior";
      case "LEAD":
        return "Lead";
      case "EXECUTIVE":
        return "Executive";
      default:
        return l;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-3xl rounded-xl bg-[var(--card)] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">Đăng job mới</Dialog.Title>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Dialog.Description className="mb-4 text-sm text-[var(--muted-foreground)]">
            Điền thông tin job và mô tả chi tiết bằng trình soạn thảo. Hỗ trợ Markdown, nội dung sẽ được chuẩn hoá để hiển thị đẹp.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Tiêu đề job" error={errors.title?.message} required>
                <Input
                  placeholder="Ví dụ: Product Designer (Mid)"
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
                  setValue("descriptionMd", v ?? "", { shouldDirty: true, shouldTouch: true, shouldValidate: false });
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
                  {employmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {translateEmploymentType(type)}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Cấp độ">
                <select
                  {...register("experienceLevel")}
                  className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  {experienceLevels.map((level) => (
                    <option key={level} value={level}>
                      {translateExperienceLevel(level)}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Làm việc từ xa">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("remote")} />
                  Cho phép làm việc từ xa
                </label>
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Lương tối thiểu" error={errors.salaryMin?.message}>
                <Input
                  placeholder="Ví dụ: 15000000"
                  inputMode="numeric"
                  {...salaryMinRegister}
                  onChange={(e) => {
                    salaryMinRegister.onChange(e).catch(() => {});
                  }}
                  onBlur={(e) => {
                    salaryMinRegister.onBlur(e).catch(() => {});
                    const v = (e.target.value || "").trim();
                    if (v && !/^\d+$/.test(v)) {
                      setError("salaryMin", { type: "manual", message: "Lương phải là số" });
                    } else {
                      clearErrors("salaryMin");
                    }
                  }}
                />
              </FormField>
              <FormField label="Lương tối đa" error={errors.salaryMax?.message}>
                <Input
                  placeholder="Ví dụ: 25000000"
                  inputMode="numeric"
                  {...salaryMaxRegister}
                  onChange={(e) => {
                    salaryMaxRegister.onChange(e).catch(() => {});
                  }}
                  onBlur={(e) => {
                    salaryMaxRegister.onBlur(e).catch(() => {});
                    const v = (e.target.value || "").trim();
                    if (v && !/^\d+$/.test(v)) {
                      setError("salaryMax", { type: "manual", message: "Lương phải là số" });
                    } else {
                      clearErrors("salaryMax");
                    }
                  }}
                />
              </FormField>
              <FormField label="Đơn vị lương" error={errors.currency?.message}>
                <Input
                  placeholder="VND"
                  maxLength={3}
                  {...currencyRegister}
                  onChange={(e) => {
                    const v = (e.target.value || "").toUpperCase();
                    e.target.value = v;
                    // cập nhật vào form state
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    currencyRegister.onChange(e);
                  }}
                  onBlur={(e) => {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    currencyRegister.onBlur(e);
                    // validate để hiển thị lỗi ngay
                    const v = (e.target.value || "").trim();
                    if (v && !/^[A-Z]{3}$/.test(v)) {
                      setError("currency", { type: "manual", message: "Mã tiền tệ phải gồm 3 chữ in hoa (VD: VND, USD)" });
                    } else {
                      clearErrors("currency");
                    }
                  }}
                />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Hạn nộp hồ sơ" error={errors.applicationDeadline?.message}>
                <Input type="date" {...register("applicationDeadline")} />
              </FormField>
              <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-xs text-[var(--muted-foreground)]">
                <p>Mẹo: Nhấn Enter để xuống dòng, dùng dấu gạch đầu dòng để liệt kê yêu cầu/quyền lợi.</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Huỷ
              </Button>
              <Button type="submit" disabled={!isFormValid || isSubmitting}>
                {isSubmitting ? "Đang đăng..." : "Đăng job"}
              </Button>
            </div>
          </form>
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


