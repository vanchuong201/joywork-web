"use client";

import { useForm } from "react-hook-form";
import type { ReactNode } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";

const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"] as const;
const experienceLevels = ["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"] as const;

const schema = z.object({
  title: z.string().min(4, "Tiêu đề tối thiểu 4 ký tự"),
  description: z.string().min(20, "Mô tả tối thiểu 20 ký tự"),
  location: z.string().optional().or(z.literal("")),
  remote: z.boolean().optional().default(false),
  employmentType: z.enum(employmentTypes).default("FULL_TIME"),
  experienceLevel: z.enum(experienceLevels).default("MID"),
  salaryMin: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^\d+$/.test(val), { message: "Lương phải là số" }),
  salaryMax: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || /^\d+$/.test(val), { message: "Lương phải là số" }),
  currency: z.string().min(3).max(3).default("VND"),
  applicationDeadline: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || !Number.isNaN(Date.parse(val)), {
      message: "Ngày không hợp lệ",
    }),
});

type FormValues = z.infer<typeof schema>;

type JobComposerProps = {
  companyId: string;
  onCreated?: () => void;
};

export default function JobComposer({ companyId, onCreated }: JobComposerProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
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

  const createJob = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        location: values.location?.trim() || undefined,
        remote: values.remote ?? false,
        employmentType: values.employmentType,
        experienceLevel: values.experienceLevel,
        salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
        salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
        currency: values.currency,
        applicationDeadline: values.applicationDeadline
          ? new Date(values.applicationDeadline).toISOString()
          : undefined,
      };
      const res = await api.post(`/api/jobs/companies/${companyId}/jobs`, payload);
      return res.data.data.job as { id: string };
    },
    onSuccess: () => {
      toast.success("Tạo job mới thành công");
      reset();
      queryClient.invalidateQueries({ queryKey: ["company-jobs", companyId] });
      onCreated?.();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Tạo job thất bại, vui lòng thử lại";
      toast.error(message);
    },
  });

  const onSubmit = async (values: FormValues) => {
    await createJob.mutateAsync(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div>
        <h3 className="text-base font-semibold text-[var(--foreground)]">Đăng job mới</h3>
        <p className="text-xs text-[var(--muted-foreground)]">Thông tin rõ ràng giúp thu hút ứng viên phù hợp.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Tiêu đề job" error={errors.title?.message}>
          <Input placeholder="Ví dụ: Product Designer (Mid)" {...register("title")} />
        </FormField>
        <FormField label="Địa điểm" error={errors.location?.message}>
          <Input placeholder="Hà Nội / Remote" {...register("location")} />
        </FormField>
      </div>

      <FormField label="Mô tả công việc" error={errors.description?.message}>
        <Textarea rows={4} placeholder="Tóm tắt nhiệm vụ chính, yêu cầu và quyền lợi..." {...register("description")} />
      </FormField>

      <div className="grid gap-4 md:grid-cols-3">
        <FormField label="Hình thức làm việc">
          <select
            {...register("employmentType")}
            className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            {employmentTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace("_", " ")}
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
                {level}
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
        <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] p-4 text-xs text-[var(--muted-foreground)]">
          <p>
            Mẹo: Nếu bạn chưa có JD đầy đủ, hãy viết mô tả ngắn gọn tập trung vào nhiệm vụ quan trọng nhất và quyền lợi nổi bật.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={isSubmitting || createJob.isPending}
        >
          Đặt lại
        </Button>
        <Button type="submit" disabled={isSubmitting || createJob.isPending}>
          {isSubmitting || createJob.isPending ? "Đang tạo..." : "Đăng job"}
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

