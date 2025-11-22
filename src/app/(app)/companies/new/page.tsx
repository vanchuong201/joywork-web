"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMemo, useState, useEffect } from "react";

const schema = z.object({
  name: z.string().min(2, "Tên doanh nghiệp cần ít nhất 2 ký tự"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug chỉ được chứa chữ thường (không dấu), số và dấu gạch ngang")
    .min(2, "Slug cần ít nhất 2 ký tự"),
  tagline: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateCompanyPage() {
  const router = useRouter();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const slugify = useMemo(
    () =>
      (value: string, options?: { trimEdge?: boolean }) => {
        const trimEdge = options?.trimEdge ?? true;
        let slug = value
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9-]/g, "-")
          .replace(/-+/g, "-");
        if (trimEdge) {
          slug = slug.replace(/^-|-$/g, "");
        }
        return slug;
      },
    [],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: { name: "", slug: "", tagline: "", description: "" },
  });

  const nameField = register("name");
  const slugField = register("slug");

  const nameValue = watch("name");
  const slugValue = watch("slug");

  useEffect(() => {
    if (!slugManuallyEdited) {
      const suggestion = slugify(nameValue || "");
      setValue("slug", suggestion, { shouldValidate: false });
    }
  }, [nameValue, slugManuallyEdited, slugify, setValue]);

  const onSubmit = async (values: FormValues) => {
    try {
      const sanitizedSlug = slugify(values.slug);
      const payload = { ...values, slug: sanitizedSlug };
      const { data } = await api.post("/api/companies", payload);
      toast.success("Đã tạo doanh nghiệp");
      router.push(`/companies/${data.data.company.slug}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? "Không thể tạo doanh nghiệp");
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold text-[var(--foreground)]">Tạo hồ sơ doanh nghiệp</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        Hoàn thành các thông tin cơ bản bên dưới để xuất bản trang giới thiệu doanh nghiệp của bạn trên JoyWork.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[var(--foreground)]">Tên doanh nghiệp *</label>
          <Input
            className="mt-1"
            placeholder="Ví dụ: JoyWork Studio"
            {...nameField}
            onChange={(event) => {
              nameField.onChange(event);
              const v = (event.target.value || "").trim();
              if (v.length >= 2) {
                clearErrors("name");
              }
            }}
            onBlur={(event) => {
              nameField.onBlur(event);
              const v = (event.target.value || "").trim();
              if (v.length < 2) {
                setError("name", { type: "manual", message: "Tên doanh nghiệp cần ít nhất 2 ký tự" });
              } else {
                clearErrors("name");
              }
            }}
          />
          {errors.name ? <p className="mt-1 text-sm text-red-500">{errors.name.message}</p> : null}
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--foreground)]">Slug (đường dẫn) *</label>
          <Input
            className="mt-1"
            placeholder="ví dụ: joywork-studio"
            {...slugField}
            value={slugValue}
            onChange={(event) => {
              slugField.onChange(event);
              setSlugManuallyEdited(true);
              const sanitized = slugify(event.target.value, { trimEdge: false });
              setValue("slug", sanitized, { shouldDirty: true, shouldTouch: true, shouldValidate: false });
              if (/^[a-z0-9-]*$/.test(sanitized)) {
                clearErrors("slug");
              }
            }}
            onBlur={(event) => {
              slugField.onBlur(event);
              const trimmed = slugify(slugValue || "");
              setValue("slug", trimmed, { shouldDirty: true, shouldTouch: true, shouldValidate: false });
              if (trimmed.length < 2) {
                setError("slug", { type: "manual", message: "Slug cần ít nhất 2 ký tự" });
              } else if (!/^[a-z0-9-]+$/.test(trimmed)) {
                setError("slug", { type: "manual", message: "Slug chỉ được chứa chữ thường (không dấu), số và dấu gạch ngang" });
              } else {
                clearErrors("slug");
              }
            }}
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Đây là đường dẫn công khai tới trang công ty của bạn:&nbsp;
            <span className="font-medium text-[var(--foreground)]">
              https://joywork.vn/companies/{slugValue || "ten-doanh-nghiep"}
            </span>
          </p>
          {errors.slug ? (
            <p className="mt-1 text-sm text-red-500">
              {errors.slug.message} (ví dụ: <code className="font-mono">joywork-studio</code>)
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Hãy dùng chữ thường, không dấu, thay khoảng trắng bằng dấu gạch ngang.
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--foreground)]">Tagline (tuỳ chọn)</label>
          <Input className="mt-1" placeholder="Câu mô tả ngắn gọn" {...register("tagline")} />
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--foreground)]">Mô tả chi tiết</label>
          <Textarea className="mt-1" placeholder="Giới thiệu về sứ mệnh, sản phẩm, văn hoá..." rows={5} {...register("description")} />
        </div>

        <Button disabled={isSubmitting} className="w-full md:w-auto">
          {isSubmitting ? "Đang tạo..." : "Tạo doanh nghiệp"}
        </Button>
      </form>
    </div>
  );
}


