"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Description } from "@headlessui/react";
import { z } from "zod";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TiptapEditor from "@/components/ui/tiptap-editor";
import { toast } from "sonner";
import api from "@/lib/api";
import { X, ChevronRight, ChevronDown } from "lucide-react";
import DOMPurify from "dompurify";

const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"] as const;
const experienceLevels = ["ENTRY", "JUNIOR", "MID", "SENIOR", "LEAD", "EXECUTIVE"] as const;

function getPlainTextLength(html: string): number {
  if (typeof window === "undefined") return html.length;
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent?.length || 0;
}

const schema = z
  .object({
    title: z.string().min(4, "Tiêu đề tối thiểu 4 ký tự").max(200, "Tiêu đề tối đa 200 ký tự"),
    location: z.string().max(100, "Địa điểm tối đa 100 ký tự").optional().or(z.literal("")),
    remote: z.boolean().optional().default(false),
    employmentType: z.enum(employmentTypes).default("FULL_TIME"),
    experienceLevel: z.enum(experienceLevels).default("MID"),
    salaryMin: z.string().refine((val) => !val || /^\d+$/.test(val), { message: "Lương phải là số" }),
    salaryMax: z.string().refine((val) => !val || /^\d+$/.test(val), { message: "Lương phải là số" }),
    currency: z.string().refine((v) => !v || /^[A-Z]{3}$/.test(v), "Mã tiền tệ phải gồm 3 chữ in hoa (VD: VND, USD)"),
    applicationDeadline: z.string().refine((val) => !val || !Number.isNaN(Date.parse(val)), { message: "Ngày không hợp lệ" }),
    tags: z.array(z.string()).max(10, "Tối đa 10 tags").optional(),
    generalInfo: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Thông tin chung tối thiểu 10 ký tự" }),
    mission: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Sứ mệnh/Vai trò tối thiểu 10 ký tự" }),
    tasks: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Nhiệm vụ chuyên môn tối thiểu 10 ký tự" }),
    knowledge: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Kiến thức chuyên môn tối thiểu 10 ký tự" }),
    skills: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Kỹ năng cần thiết tối thiểu 10 ký tự" }),
    attitude: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Thái độ và phẩm chất tối thiểu 10 ký tự" }),
    kpis: z.string().optional(),
    authority: z.string().optional(),
    relationships: z.string().optional(),
    careerPath: z.string().optional(),
    benefitsIncome: z.string().max(200, "Thu nhập tối đa 200 ký tự").optional().or(z.literal("")),
    benefitsPerks: z.string().optional(),
    contact: z.string().max(500, "Thông tin liên hệ tối đa 500 ký tự").optional().or(z.literal("")),
  })
  .superRefine((vals, ctx) => {
    const fields = [
      { key: "generalInfo", max: 5000, label: "Thông tin chung" },
      { key: "mission", max: 5000, label: "Sứ mệnh/Vai trò" },
      { key: "tasks", max: 10000, label: "Nhiệm vụ chuyên môn" },
      { key: "knowledge", max: 5000, label: "Kiến thức chuyên môn" },
      { key: "skills", max: 5000, label: "Kỹ năng cần thiết" },
      { key: "attitude", max: 5000, label: "Thái độ và phẩm chất" },
      { key: "kpis", max: 5000, label: "Kết quả chuyên môn" },
      { key: "authority", max: 5000, label: "Quyền hạn" },
      { key: "relationships", max: 5000, label: "Quan hệ công việc" },
      { key: "careerPath", max: 5000, label: "Lộ trình phát triển" },
      { key: "benefitsPerks", max: 2000, label: "Phúc lợi" },
    ] as const;

    fields.forEach(({ key, max, label }) => {
      const value = vals[key as keyof typeof vals] as string | undefined;
      if (value && getPlainTextLength(value) > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${label} tối đa ${max} ký tự`,
        });
      }
    });

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
  job: any;
  onSuccess?: () => void;
};

const DESCRIPTION_SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["p", "strong", "em", "u", "s", "span", "a", "ul", "ol", "li", "blockquote", "code", "pre", "h1", "h2", "h3", "br", "div"],
  ALLOWED_ATTR: ["href", "target", "rel", "style", "class"],
};

function sanitizeHtml(html: string): string {
  const sanitized = DOMPurify.sanitize(html, DESCRIPTION_SANITIZE_CONFIG as any);
  return typeof sanitized === "string" ? sanitized : String(sanitized);
}

export default function EditJobModal({ open, onOpenChange, job, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["basic", "general", "mission", "tasks", "ksa"]));

  const resolver: Resolver<FormValues> = async (values) => {
    const result = schema.safeParse(values);
    if (result.success) {
      return { values: result.data, errors: {} };
    }
    const fieldErrors = result.error.issues.reduce<Record<string, { type: string; message: string }>>((acc, issue) => {
      const field = issue.path[0];
      if (typeof field === "string" && !acc[field]) {
        acc[field] = { type: issue.code, message: issue.message };
      }
      return acc;
    }, {});
    return { values: {}, errors: fieldErrors };
  };

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      title: "",
      location: "",
      remote: false,
      employmentType: "FULL_TIME",
      experienceLevel: "MID",
      salaryMin: "",
      salaryMax: "",
      currency: "VND",
      applicationDeadline: "",
      tags: [],
      generalInfo: "",
      mission: "",
      tasks: "",
      knowledge: "",
      skills: "",
      attitude: "",
      kpis: "",
      authority: "",
      relationships: "",
      careerPath: "",
      benefitsIncome: "",
      benefitsPerks: "",
      contact: "",
    },
  });

  useEffect(() => {
    if (open && job) {
      reset({
        title: job.title ?? "",
        location: job.location ?? "",
        remote: job.remote ?? false,
        employmentType: job.employmentType ?? "FULL_TIME",
        experienceLevel: job.experienceLevel ?? "MID",
        salaryMin: job.salaryMin != null ? String(job.salaryMin) : "",
        salaryMax: job.salaryMax != null ? String(job.salaryMax) : "",
        currency: job.currency ?? "VND",
        applicationDeadline: job.applicationDeadline ? job.applicationDeadline.slice(0, 10) : "",
        tags: job.tags ?? [],
        generalInfo: job.generalInfo ?? "",
        mission: job.mission ?? "",
        tasks: job.tasks ?? "",
        knowledge: job.knowledge ?? "",
        skills: job.skills ?? "",
        attitude: job.attitude ?? "",
        kpis: job.kpis ?? "",
        authority: job.authority ?? "",
        relationships: job.relationships ?? "",
        careerPath: job.careerPath ?? "",
        benefitsIncome: job.benefitsIncome ?? "",
        benefitsPerks: job.benefitsPerks ?? "",
        contact: job.contact ?? "",
      });
    }
  }, [open, job, reset]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: values.title.trim(),
        location: values.location?.trim() || null,
        remote: values.remote ?? false,
        employmentType: values.employmentType,
        experienceLevel: values.experienceLevel,
        salaryMin: values.salaryMin ? Number(values.salaryMin) : null,
        salaryMax: values.salaryMax ? Number(values.salaryMax) : null,
        ...(values.currency?.trim() ? { currency: values.currency.trim().toUpperCase() } : {}),
        applicationDeadline: values.applicationDeadline ? new Date(values.applicationDeadline).toISOString() : null,
        generalInfo: sanitizeHtml(values.generalInfo),
        mission: sanitizeHtml(values.mission),
        tasks: sanitizeHtml(values.tasks),
        knowledge: sanitizeHtml(values.knowledge),
        skills: sanitizeHtml(values.skills),
        attitude: sanitizeHtml(values.attitude),
        kpis: values.kpis ? sanitizeHtml(values.kpis) : null,
        authority: values.authority ? sanitizeHtml(values.authority) : null,
        relationships: values.relationships ? sanitizeHtml(values.relationships) : null,
        careerPath: values.careerPath ? sanitizeHtml(values.careerPath) : null,
        benefitsIncome: values.benefitsIncome?.trim() || null,
        benefitsPerks: values.benefitsPerks ? sanitizeHtml(values.benefitsPerks) : null,
        contact: values.contact?.trim() || null,
      };

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/9026dbdf-4370-41c8-a2ad-ea341cdeab12',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'job-edit-pre',hypothesisId:'H1',location:'EditJobModal.tsx:onSubmit',message:'edit submit payload summary',data:{jobId:job?.id,keys:Object.keys(payload),skillsType:typeof payload.skills,skillsIsArray:Array.isArray(payload.skills),skillsLen:(payload.skills as string | null | undefined)?.length ?? null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      await api.patch(`/api/jobs/${job.id}`, payload);
      toast.success("Cập nhật job thành công");
      onSuccess?.();
      handleClose();
    } catch (e: any) {
      const err = e?.response?.data?.error;
      const details = err?.details;
      if (Array.isArray(details)) {
        for (const d of details) {
          const path = Array.isArray(d?.path) ? d.path : [];
          const field = path[0];
          const msg = d?.message || err?.message || "Dữ liệu không hợp lệ";
          if (field) {
            setError(field as keyof FormValues, { type: "server", message: msg });
          }
        }
      } else {
        toast.error(err?.message ?? "Cập nhật job thất bại");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false);
    }
  };

  const translateEmploymentType = (t: (typeof employmentTypes)[number]) => {
    const map: Record<string, string> = {
      FULL_TIME: "Toàn thời gian",
      PART_TIME: "Bán thời gian",
      CONTRACT: "Hợp đồng",
      INTERNSHIP: "Thực tập",
      FREELANCE: "Tự do",
    };
    return map[t] || t;
  };

  const translateExperienceLevel = (l: (typeof experienceLevels)[number]) => {
    const map: Record<string, string> = {
      ENTRY: "Mới tốt nghiệp",
      JUNIOR: "Nhân viên",
      MID: "Chuyên viên",
      SENIOR: "Chuyên viên cao cấp",
      LEAD: "Trưởng nhóm",
      EXECUTIVE: "Điều hành",
    };
    return map[l] || l;
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
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
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-start justify-center p-4 overflow-y-auto">
        <DialogPanel className="mx-auto w-full max-w-4xl rounded-xl bg-[var(--card)] p-6 shadow-xl my-8 max-h-[90vh] overflow-y-auto scroll-smooth">
          <div className="mb-4 flex items-center justify-between sticky top-0 bg-[var(--card)] z-10 pb-4 border-b border-[var(--border)] -mt-6 -mx-6 px-6 pt-6">
            <DialogTitle className="text-xl font-semibold text-[var(--foreground)]">Chỉnh sửa job</DialogTitle>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Description className="mb-6 text-sm text-[var(--muted-foreground)]">
            Cập nhật đầy đủ thông tin để JD chuẩn. Các trường có dấu <span className="text-red-500">*</span> là bắt buộc.
          </Description>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormSection title="1. Thông tin cơ bản" isExpanded={expandedSections.has("basic")} onToggle={() => toggleSection("basic")}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Tiêu đề vị trí" error={errors.title?.message} required>
                  <Input placeholder="Ví dụ: Senior Frontend Developer" {...register("title")} />
                </FormField>
                <FormField label="Địa điểm" error={errors.location?.message}>
                  <Input placeholder="Hà Nội, TP.HCM, Remote..." {...register("location")} />
                </FormField>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Hình thức làm việc">
                  <select {...register("employmentType")} className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm">
                    {employmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {translateEmploymentType(type)}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Cấp độ">
                  <select {...register("experienceLevel")} className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm">
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
                  <Input placeholder="15000000" inputMode="numeric" {...register("salaryMin")} />
                </FormField>
                <FormField label="Lương tối đa" error={errors.salaryMax?.message}>
                  <Input placeholder="25000000" inputMode="numeric" {...register("salaryMax")} />
                </FormField>
                <FormField label="Đơn vị tiền tệ" error={errors.currency?.message}>
                  <Input placeholder="VND" maxLength={3} {...register("currency")} onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    register("currency").onChange(e);
                  }} />
                </FormField>
              </div>
              <FormField label="Hạn nộp hồ sơ" error={errors.applicationDeadline?.message}>
                <Input type="date" {...register("applicationDeadline")} />
              </FormField>
            </FormSection>

            <FormSection title="2. Thông tin chung" isExpanded={expandedSections.has("general")} onToggle={() => toggleSection("general")} required>
              <FormField label="Nhập thông tin chung (Bộ phận, Báo cáo cho...)" error={errors.generalInfo?.message} required>
                <Controller
                  name="generalInfo"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="● Tên vị trí: Senior Developer&#10;● Bộ phận: Engineering&#10;● Báo cáo cho: CTO"
                    />
                  )}
                />
              </FormField>
            </FormSection>

            <FormSection title="3. Sứ mệnh / Vai trò tổng quát" isExpanded={expandedSections.has("mission")} onToggle={() => toggleSection("mission")} required>
              <FormField label="Mô tả sứ mệnh và vai trò của vị trí" error={errors.mission?.message} required>
                <Controller
                  name="mission"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Đóng góp giá trị vào mục tiêu chung của công ty..."
                    />
                  )}
                />
              </FormField>
            </FormSection>

            <FormSection title="4. Nhiệm vụ chuyên môn" isExpanded={expandedSections.has("tasks")} onToggle={() => toggleSection("tasks")} required>
              <FormField label="Mô tả chi tiết nhiệm vụ và trách nhiệm" error={errors.tasks?.message} required>
                <Controller
                  name="tasks"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="• Phát triển và duy trì các ứng dụng web&#10;• Code review và mentoring..."
                    />
                  )}
                />
              </FormField>
            </FormSection>

            <FormSection title="5. Kết quả chuyên môn cần đạt (Tùy chọn)" isExpanded={expandedSections.has("kpis")} onToggle={() => toggleSection("kpis")}>
              <FormField label="Mô tả các KPI/OKR cần đạt" error={errors.kpis?.message}>
                <Controller
                  name="kpis"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="• Số lượng và chất lượng thành viên các cộng đồng&#10;• Tỷ lệ thành viên hoạt động và tương tác..."
                    />
                  )}
                />
              </FormField>
            </FormSection>

            <FormSection title="6. Yêu cầu (KSA - Knowledge, Skills, Attitude)" isExpanded={expandedSections.has("ksa")} onToggle={() => toggleSection("ksa")} required>
              <div className="space-y-4">
                <FormField label="Kiến thức chuyên môn" error={errors.knowledge?.message} required>
                  <Controller
                    name="knowledge"
                    control={control}
                    render={({ field }) => (
                      <TiptapEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="• Có kinh nghiệm tối thiểu trong việc phát triển, quản lý cộng đồng&#10;• Hiểu biết về MBO, OKRs..."
                      />
                    )}
                  />
                </FormField>
                <FormField label="Kỹ năng cần thiết" error={errors.skills?.message} required>
                  <Controller
                    name="skills"
                    control={control}
                    render={({ field }) => (
                      <TiptapEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="• Khả năng lập và kiểm soát kế hoạch tốt&#10;• Tư duy chiến lược..."
                      />
                    )}
                  />
                </FormField>
                <FormField label="Thái độ và phẩm chất" error={errors.attitude?.message} required>
                  <Controller
                    name="attitude"
                    control={control}
                    render={({ field }) => (
                      <TiptapEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="• Phù hợp với văn hóa và giá trị cốt lõi công ty&#10;• Đam mê tạo ra giá trị..."
                      />
                    )}
                  />
                </FormField>
              </div>
            </FormSection>

            <FormSection title="7. Quyền hạn và phạm vi ra quyết định (Tùy chọn)" isExpanded={expandedSections.has("authority")} onToggle={() => toggleSection("authority")}>
              <FormField label="Mô tả quyền hạn" error={errors.authority?.message}>
                <Controller
                  name="authority"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="• Kế hoạch hoạt động hàng ngày&#10;• Nội dung và hình thức tương tác..."
                    />
                  )}
                />
              </FormField>
            </FormSection>

            <FormSection title="8. Quan hệ công việc (Tùy chọn)" isExpanded={expandedSections.has("relationships")} onToggle={() => toggleSection("relationships")}>
              <FormField label="Mô tả quan hệ nội bộ và bên ngoài" error={errors.relationships?.message}>
                <Controller
                  name="relationships"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="Quan hệ nội bộ:&#10;• CEO - nhận định hướng và báo cáo trực tiếp&#10;&#10;Quan hệ bên ngoài:&#10;• Thành viên các cộng đồng..."
                    />
                  )}
                />
              </FormField>
            </FormSection>

            <FormSection title="9. Lộ trình phát triển (Tùy chọn)" isExpanded={expandedSections.has("careerPath")} onToggle={() => toggleSection("careerPath")}>
              <FormField label="Mô tả lộ trình phát triển" error={errors.careerPath?.message}>
                <Controller
                  name="careerPath"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="• Xây dựng và quản lý team khi cộng đồng phát triển&#10;• Mở rộng phạm vi quản lý..."
                    />
                  )}
                />
              </FormField>
            </FormSection>

            <FormSection title="10. Quyền lợi (Tùy chọn)" isExpanded={expandedSections.has("benefits")} onToggle={() => toggleSection("benefits")}>
              <FormField label="Thu nhập" error={errors.benefitsIncome?.message}>
                <Input placeholder="Từ 15 triệu++, thỏa thuận..." {...register("benefitsIncome")} />
              </FormField>
              <FormField label="Chế độ, phúc lợi" error={errors.benefitsPerks?.message}>
                <Controller
                  name="benefitsPerks"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="• Làm việc linh hoạt ở bất cứ đâu&#10;• Được tiếp cận và học hỏi trực tiếp từ CEO..."
                    />
                  )}
                />
              </FormField>
            </FormSection>

            <FormSection title="11. Thông tin liên hệ (Tùy chọn)" isExpanded={expandedSections.has("contact")} onToggle={() => toggleSection("contact")}>
              <FormField label="Thông tin liên hệ để ứng viên nộp hồ sơ" error={errors.contact?.message}>
                <Input
                  placeholder="Liên hệ Zalo: 096 1128912&#10;Gửi CV về mail: tuyendung@company.vn"
                  {...register("contact")}
                />
              </FormField>
            </FormSection>

            <div className="sticky bottom-0 bg-[var(--card)] border-t border-[var(--border)] pt-4 mt-6 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Huỷ
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function FormSection({
  title,
  isExpanded,
  onToggle,
  required,
  children,
}: {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-[var(--muted)]/50 hover:bg-[var(--muted)] transition-colors"
      >
        <span className="font-semibold text-[var(--foreground)]">
          {title}
          {required && <span className="ml-1 text-red-500">*</span>}
        </span>
        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>
      {isExpanded && <div className="p-4 space-y-4">{children}</div>}
    </div>
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

