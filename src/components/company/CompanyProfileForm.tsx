"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
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
import { uploadCompanyLogo, uploadCompanyCover } from "@/lib/uploads";
import Image from "next/image";

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
  // logoUrl and coverUrl are set automatically via file upload, not user input
  logoUrl: z.string().optional().or(z.literal("")),
  coverUrl: z.string().optional().or(z.literal("")),
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Không thể đọc dữ liệu ảnh"));
        return;
      }
      const commaIndex = result.indexOf(",");
      const base64 = commaIndex >= 0 ? result.slice(commaIndex + 1) : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Không thể đọc tệp ảnh"));
    reader.readAsDataURL(file);
  });
}

export default function CompanyProfileForm({
  companyId,
  initialData,
  onSuccess,
}: CompanyProfileFormProps) {
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [logoKey, setLogoKey] = useState<string | null>(null);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
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

  const logoUrl = watch("logoUrl");
  const coverUrl = watch("coverUrl");

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
    // Extract key from URL if it's an S3 URL
    if (initialData.logoUrl) {
      const match = initialData.logoUrl.match(/companies\/[^/]+\/logo\/[^/?]+/);
      if (match) setLogoKey(match[0]);
    }
    if (initialData.coverUrl) {
      const match = initialData.coverUrl.match(/companies\/[^/]+\/cover\/[^/?]+/);
      if (match) setCoverKey(match[0]);
    }
  }, [initialData, reset]);

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Ảnh vượt quá giới hạn 8MB.");
      event.target.value = "";
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Chỉ hỗ trợ JPG, PNG hoặc WEBP.");
      event.target.value = "";
      return;
    }

    setLogoUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const response = await uploadCompanyLogo({
        companyId,
        fileName: file.name,
        fileType: file.type,
        fileData: base64,
        previousKey: logoKey ?? undefined,
      });
      setLogoKey(response.key);
      setValue("logoUrl", response.assetUrl, { shouldDirty: true });
      toast.success("Tải logo thành công");
    } catch (error: any) {
      const message = error instanceof Error ? error.message : "Tải logo thất bại, vui lòng thử lại.";
      toast.error(message);
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  };

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Ảnh vượt quá giới hạn 8MB.");
      event.target.value = "";
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Chỉ hỗ trợ JPG, PNG hoặc WEBP.");
      event.target.value = "";
      return;
    }

    setCoverUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const response = await uploadCompanyCover({
        companyId,
        fileName: file.name,
        fileType: file.type,
        fileData: base64,
        previousKey: coverKey ?? undefined,
      });
      setCoverKey(response.key);
      setValue("coverUrl", response.assetUrl, { shouldDirty: true });
      toast.success("Tải ảnh cover thành công");
    } catch (error: any) {
      const message = error instanceof Error ? error.message : "Tải ảnh cover thất bại, vui lòng thử lại.";
      toast.error(message);
    } finally {
      setCoverUploading(false);
      event.target.value = "";
    }
  };

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
              value={field.value || ""}
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

      <div className="grid gap-6 md:grid-cols-2">
        <FormField label="Logo" error={errors.logoUrl?.message}>
          <div className="space-y-3">
            {logoUrl ? (
              <div className="relative inline-block">
                <Image
                  src={logoUrl}
                  alt="Logo"
                  width={120}
                  height={120}
                  className="h-[120px] w-[120px] rounded-lg border border-[var(--border)] object-cover"
                />
                {logoUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-xs text-white">
                    Đang tải...
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-[120px] w-[120px] items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)] text-sm text-[var(--muted-foreground)]">
                Chưa có logo
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoUploading}
              >
                {logoUrl ? "Đổi logo" : "Tải logo"}
              </Button>
              {logoUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setValue("logoUrl", "", { shouldDirty: true });
                    setLogoKey(null);
                  }}
                  disabled={logoUploading}
                >
                  Gỡ logo
                </Button>
              )}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Hỗ trợ JPG, PNG, WEBP (tối đa 8MB). Logo vuông, kích thước đề xuất 512x512px.
            </p>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
        </FormField>
        <FormField label="Ảnh cover" error={errors.coverUrl?.message}>
          <div className="space-y-3">
            {coverUrl ? (
              <div className="relative">
                <Image
                  src={coverUrl}
                  alt="Cover"
                  width={400}
                  height={200}
                  className="h-48 w-full rounded-lg border border-[var(--border)] object-cover"
                />
                {coverUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 text-xs text-white">
                    Đang tải...
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-48 w-full items-center justify-center rounded-lg border border-dashed border-[var(--border)] bg-[var(--muted)] text-sm text-[var(--muted-foreground)]">
                Chưa có ảnh cover
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => coverInputRef.current?.click()}
                disabled={coverUploading}
              >
                {coverUrl ? "Đổi ảnh cover" : "Tải ảnh cover"}
              </Button>
              {coverUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setValue("coverUrl", "", { shouldDirty: true });
                    setCoverKey(null);
                  }}
                  disabled={coverUploading}
                >
                  Gỡ ảnh cover
                </Button>
              )}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Hỗ trợ JPG, PNG, WEBP (tối đa 8MB). Tỷ lệ đề xuất 16:9, kích thước tối thiểu 1200x675px.
            </p>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </div>
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

