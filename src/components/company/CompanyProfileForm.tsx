"use client";

import { useEffect, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/ui/rich-text-editor";
import DOMPurify from "dompurify";
import TurndownService from "turndown";
import { marked } from "marked";

const sizeOptions = ["STARTUP", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"] as const;

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

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

function htmlToMarkdown(html?: string | null) {
  if (!html) return "";
  try {
    return turndown.turndown(html);
  } catch (error) {
    console.warn("Failed to convert HTML to markdown", error);
    return html;
  }
}

function markdownToHtml(markdown?: string | null) {
  if (!markdown) return "";
  const html = marked.parse(markdown, { breaks: true });
  return typeof html === "string" ? html : "";
}

function sanitizeDescription(markdown: string | undefined | null) {
  if (!markdown) return "";
  const rawHtml = markdownToHtml(markdown);
  const sanitized = DOMPurify.sanitize(rawHtml, DESCRIPTION_SANITIZE_CONFIG);
  const normalized = sanitized.replace(/(<p><br><\/p>|\s|&nbsp;)+$/gi, "").trim();
  if (!normalized || normalized === "<p></p>") {
    return "";
  }
  return sanitized;
}

const schema = z.object({
  name: z.string().min(2, "Tên công ty cần ít nhất 2 ký tự"),
  tagline: z
    .string()
    .max(120, "Tagline tối đa 120 ký tự")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(10000, "Mô tả tối đa 10.000 ký tự")
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: "Vui lòng nhập URL bắt đầu bằng http:// hoặc https://",
    }),
  location: z.string().max(120, "Địa điểm tối đa 120 ký tự").optional().or(z.literal("")),
  industry: z.string().max(60, "Ngành tối đa 60 ký tự").optional().or(z.literal("")),
  size: z.enum(sizeOptions).optional().or(z.literal("")),
  foundedYear: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^\d{4}$/.test(val), {
      message: "Năm thành lập cần gồm 4 chữ số",
    }),
  headcount: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^\d+$/.test(val), {
      message: "Quy mô nhân sự phải là số",
    }),
  headcountNote: z.string().max(200, "Ghi chú tối đa 200 ký tự").optional().or(z.literal("")),
  logoUrl: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: "URL logo cần bắt đầu bằng http:// hoặc https://",
    }),
  coverUrl: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^https?:\/\//i.test(val), {
      message: "URL cover cần bắt đầu bằng http:// hoặc https://",
    }),
});

type FormValues = z.infer<typeof schema>;

type CompanyProfileFormProps = {
  companyId: string;
  initialData: {
    name: string;
    tagline?: string | null;
    description?: string | null;
    website?: string | null;
    location?: string | null;
    industry?: string | null;
    size?: string | null;
    foundedYear?: number | null;
    headcount?: number | null;
    headcountNote?: string | null;
    logoUrl?: string | null;
    coverUrl?: string | null;
  };
  onSuccess?: () => void;
};

export default function CompanyProfileForm({
  companyId,
  initialData,
  onSuccess,
}: CompanyProfileFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData.name,
      tagline: initialData.tagline ?? "",
      description: htmlToMarkdown(initialData.description),
      website: initialData.website ?? "",
      location: initialData.location ?? "",
      industry: initialData.industry ?? "",
      size: (initialData.size as FormValues["size"]) ?? "",
      foundedYear: initialData.foundedYear ? String(initialData.foundedYear) : "",
      headcount: initialData.headcount ? String(initialData.headcount) : "",
      headcountNote: initialData.headcountNote ?? "",
      logoUrl: initialData.logoUrl ?? "",
      coverUrl: initialData.coverUrl ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: initialData.name,
      tagline: initialData.tagline ?? "",
      description: htmlToMarkdown(initialData.description),
      website: initialData.website ?? "",
      location: initialData.location ?? "",
      industry: initialData.industry ?? "",
      size: (initialData.size as FormValues["size"]) ?? "",
      foundedYear: initialData.foundedYear ? String(initialData.foundedYear) : "",
      headcount: initialData.headcount ? String(initialData.headcount) : "",
      headcountNote: initialData.headcountNote ?? "",
      logoUrl: initialData.logoUrl ?? "",
      coverUrl: initialData.coverUrl ?? "",
    });
  }, [initialData, reset]);

  const updateCompany = useMutation({
    mutationFn: async (values: FormValues) => {
      const sanitizedDescription = sanitizeDescription(values.description);
      const payload = {
        name: values.name.trim(),
        tagline: values.tagline?.trim() || undefined,
        description: sanitizedDescription || undefined,
        website: values.website?.trim() || undefined,
        location: values.location?.trim() || undefined,
        industry: values.industry?.trim() || undefined,
        size: values.size ? values.size : undefined,
        foundedYear: values.foundedYear ? Number(values.foundedYear) : undefined,
        headcount: values.headcount ? Number(values.headcount) : undefined,
        headcountNote: values.headcountNote?.trim() || undefined,
        logoUrl: values.logoUrl?.trim() || undefined,
        coverUrl: values.coverUrl?.trim() || undefined,
      };
      const res = await api.patch(`/api/companies/${companyId}`, payload);
      return res.data.data.company as typeof initialData;
    },
    onSuccess: () => {
      toast.success("Cập nhật thông tin công ty thành công");
      onSuccess?.();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Cập nhật thất bại, vui lòng thử lại";
      toast.error(message);
    },
  });

  const onSubmit = async (values: FormValues) => {
    await updateCompany.mutateAsync(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Tên công ty" error={errors.name?.message}>
          <Input placeholder="Ví dụ: JoyWork Studio" {...register("name")} />
        </FormField>
        <FormField label="Tagline" error={errors.tagline?.message}>
          <Input placeholder="Thông điệp ngắn gọn" {...register("tagline")} />
        </FormField>
      </div>

      <FormField label="Giới thiệu" error={errors.description?.message}>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={(content) => field.onChange(content)}
              placeholder="Mô tả ngắn về công ty..."
            />
          )}
        />
      </FormField>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Website" error={errors.website?.message}>
          <Input placeholder="https://your-company.com" {...register("website")} />
        </FormField>
        <FormField label="Địa điểm" error={errors.location?.message}>
          <Input placeholder="Hà Nội, Việt Nam" {...register("location")} />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField label="Ngành nghề" error={errors.industry?.message}>
          <Input placeholder="Công nghệ, Giáo dục..." {...register("industry")} />
        </FormField>
        <FormField label="Quy mô" error={errors.size?.message}>
          <select
            {...register("size")}
            className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <option value="">Chọn quy mô</option>
            {sizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Năm thành lập" error={errors.foundedYear?.message}>
          <Input placeholder="2020" inputMode="numeric" {...register("foundedYear")} />
        </FormField>
        <FormField label="Quy mô nhân sự" error={errors.headcount?.message}>
          <Input placeholder="Ví dụ: 120" inputMode="numeric" {...register("headcount")} />
        </FormField>
        <FormField label="Ghi chú quy mô" error={errors.headcountNote?.message}>
          <Input placeholder="Ví dụ: Bao gồm cả đội part-time" {...register("headcountNote")} />
        </FormField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Logo URL" error={errors.logoUrl?.message}>
          <Input placeholder="https://..." {...register("logoUrl")} />
        </FormField>
        <FormField label="Cover URL" error={errors.coverUrl?.message}>
          <Input placeholder="https://..." {...register("coverUrl")} />
        </FormField>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isSubmitting}
        >
          Khôi phục
        </Button>
        <Button
          type="submit"
          disabled={!isDirty || isSubmitting || updateCompany.isPending}
        >
          {isSubmitting || updateCompany.isPending ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-[var(--foreground)]">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  );
}

