"use client";

import { useState, type ReactNode, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import { X } from "lucide-react";

const sizeOptions = ["STARTUP", "SMALL", "MEDIUM", "LARGE", "ENTERPRISE"] as const;

const schema = z.object({
  name: z.string().min(2, "Tên công ty cần ít nhất 2 ký tự"),
  legalName: z.string().max(200, "Tên đăng ký kinh doanh tối đa 200 ký tự").optional().or(z.literal("")),
  tagline: z
    .string()
    .max(120, "Tagline tối đa 120 ký tự")
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
});

type FormValues = z.infer<typeof schema>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  initialData: {
    name: string;
    legalName?: string | null;
    tagline?: string | null;
    website?: string | null;
    location?: string | null;
    industry?: string | null;
    size?: string | null;
    foundedYear?: number | null;
  };
  onSuccess: () => void;
};

export default function EditCompanyInfoModal({
  isOpen,
  onClose,
  companyId,
  initialData,
  onSuccess,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData.name,
      legalName: initialData.legalName ?? "",
      tagline: initialData.tagline ?? "",
      website: initialData.website ?? "",
      location: initialData.location ?? "",
      industry: initialData.industry ?? "",
      size: (initialData.size as FormValues["size"]) ?? "",
      foundedYear: initialData.foundedYear ? String(initialData.foundedYear) : "",
    },
  });

  // Keep form in sync when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData.name,
        legalName: initialData.legalName ?? "",
        tagline: initialData.tagline ?? "",
        website: initialData.website ?? "",
        location: initialData.location ?? "",
        industry: initialData.industry ?? "",
        size: (initialData.size as FormValues["size"]) ?? "",
        foundedYear: initialData.foundedYear ? String(initialData.foundedYear) : "",
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name.trim(),
        legalName: values.legalName?.trim() || undefined,
        tagline: values.tagline?.trim() || undefined,
        website: values.website?.trim() || undefined,
        location: values.location?.trim() || undefined,
        industry: values.industry?.trim() || undefined,
        size: values.size ? values.size : undefined,
        foundedYear: values.foundedYear ? Number(values.foundedYear) : undefined,
      };
      await api.patch(`/api/companies/${companyId}`, payload);
      toast.success("Cập nhật thông tin công ty thành công");
      onSuccess();
      handleClose();
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? "Cập nhật thất bại, vui lòng thử lại";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-xl bg-[var(--card)] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-[var(--foreground)]">
              Chỉnh sửa thông tin công ty
            </Dialog.Title>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Dialog.Description className="mb-4 text-sm text-[var(--muted-foreground)]">
            Cập nhật thông tin cơ bản của công ty. Những thông tin này sẽ được hiển thị công khai trên trang công ty.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Tên công ty" required error={errors.name?.message}>
                <Input placeholder="Ví dụ: JoyWork Studio" {...register("name")} />
              </FormField>
              <FormField label="Tên đăng ký kinh doanh" error={errors.legalName?.message}>
                <Input placeholder="Công ty Cổ phần Công nghệ JoyWork" {...register("legalName")} />
              </FormField>
            </div>

            <div className="grid gap-4 md:grid-cols-1">
              <FormField label="Tagline" error={errors.tagline?.message}>
                <Input placeholder="Thông điệp ngắn gọn" {...register("tagline")} />
              </FormField>
            </div>

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
                  <option value="STARTUP">Startup (1-20)</option>
                  <option value="SMALL">Nhỏ (20-50)</option>
                  <option value="MEDIUM">Vừa (50-200)</option>
                  <option value="LARGE">Lớn (200-1000)</option>
                  <option value="ENTERPRISE">Tập đoàn (&gt;1000)</option>
                </select>
              </FormField>
              <FormField label="Năm thành lập" error={errors.foundedYear?.message}>
                <Input placeholder="2020" inputMode="numeric" {...register("foundedYear")} />
              </FormField>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Huỷ
              </Button>
              <Button
                type="submit"
                disabled={!isDirty || isSubmitting}
              >
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
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
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-[var(--foreground)]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  );
}

