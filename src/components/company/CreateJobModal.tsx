"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { z } from "zod";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TiptapEditor from "@/components/ui/tiptap-editor";
import { toast } from "sonner";
import api from "@/lib/api";
import { ChevronRight, ChevronDown } from "lucide-react";
import DOMPurify from "dompurify";
import ProvinceSelect from "@/components/ui/province-select";

const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"] as const;
const experienceLevels = ["NO_EXPERIENCE", "LT_1_YEAR", "Y1_2", "Y2_3", "Y3_5", "Y5_10", "GT_10"] as const;
const jobLevels = ["INTERN_STUDENT", "FRESH_GRAD", "EMPLOYEE", "SPECIALIST_TEAM_LEAD", "MANAGER_HEAD", "DIRECTOR", "EXECUTIVE"] as const;
const educationLevels = ["NONE", "HIGH_SCHOOL", "COLLEGE", "BACHELOR", "MASTER", "PHD"] as const;

// Helper function to strip HTML tags and get plain text length
function getPlainTextLength(html: string): number {
  if (typeof window === "undefined") return html.length; // Server-side fallback
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent?.length || 0;
}

function optionalEnum<T extends readonly [string, ...string[]]>(values: T, message: string) {
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.enum(values, { message }).optional(),
  );
}

// Schema validation
const schema = z
  .object({
    // Basic info
    title: z.string().min(4, "Tiêu đề tối thiểu 4 ký tự").max(200, "Tiêu đề tối đa 200 ký tự"),
    locations: z.array(z.string()).optional(),
    remote: z.boolean().optional().default(false),
    employmentType: z.enum(employmentTypes).default("FULL_TIME"),
    experienceLevel: z.enum(experienceLevels).default("NO_EXPERIENCE"),
    salaryMin: z.string().refine((val) => !val || /^\d+$/.test(val), { message: "Lương phải là số" }),
    salaryMax: z.string().refine((val) => !val || /^\d+$/.test(val), { message: "Lương phải là số" }),
    currency: z.enum(["VND", "USD"]).default("VND"),
    applicationDeadline: z.string().refine((val) => !val || !Number.isNaN(Date.parse(val)), { message: "Ngày không hợp lệ" }),
    tags: z.array(z.string()).max(10, "Tối đa 10 tags").optional(),
    // Header fields
    department: z.string().max(100, "Bộ phận tối đa 100 ký tự").optional().or(z.literal("")),
    jobLevel: optionalEnum(jobLevels, "Cấp bậc không hợp lệ"),
    educationLevel: optionalEnum(educationLevels, "Học vấn không hợp lệ"),
    
    // Required JD fields (HTML from Tiptap)
    generalInfo: z.string().optional(),
    mission: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Sứ mệnh/Vai trò tối thiểu 10 ký tự" }),
    tasks: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Nhiệm vụ chuyên môn tối thiểu 10 ký tự" }),
    knowledge: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Kiến thức chuyên môn tối thiểu 10 ký tự" }),
    skills: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Kỹ năng cần thiết tối thiểu 10 ký tự" }),
    attitude: z.string().refine((val) => getPlainTextLength(val) >= 10, { message: "Thái độ và phẩm chất tối thiểu 10 ký tự" }),
    
    // Optional JD fields
    kpis: z.string().optional(),
    authority: z.string().optional(),
    relationships: z.string().optional(),
    careerPath: z.string().optional(),
    benefitsIncome: z.string().max(200, "Thu nhập tối đa 200 ký tự").optional().or(z.literal("")),
    benefitsPerks: z.string().optional(),
  })
  .superRefine((vals, ctx) => {
    // Validate text length limits (strip HTML)
    const fields = [
      { key: "generalInfo", max: 5000, label: "Thông tin bổ sung" },
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
    
    // Salary validation
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
  ALLOWED_TAGS: ["p", "strong", "em", "u", "s", "span", "a", "ul", "ol", "li", "blockquote", "code", "pre", "h1", "h2", "h3", "br", "div"],
  ALLOWED_ATTR: ["href", "target", "rel", "style", "class"],
};

function sanitizeHtml(html: string): string {
  const sanitized = DOMPurify.sanitize(html, DESCRIPTION_SANITIZE_CONFIG as any);
  return typeof sanitized === "string" ? sanitized : String(sanitized);
}

export default function CreateJobModal({ open, onOpenChange, companyId, onSuccess }: Props) {
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
    setValue,
    setError,
    watch,
    formState: { errors, submitCount, isSubmitted },
  } = useForm<FormValues>({
    resolver,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      title: "",
      locations: [],
      remote: false,
      employmentType: "FULL_TIME",
      experienceLevel: "NO_EXPERIENCE",
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
    },
  });

  // Calculate validation errors for summary box
  const validationErrorList = Object.keys(errors).map((field) => {
    const error = errors[field as keyof typeof errors];
    const fieldLabels: Record<string, string> = {
      title: "Tiêu đề vị trí",
      department: "Bộ phận",
      jobLevel: "Cấp bậc",
      educationLevel: "Học vấn",
      generalInfo: "Thông tin bổ sung",
      mission: "Sứ mệnh/Vai trò",
      tasks: "Nhiệm vụ chuyên môn",
      knowledge: "Kiến thức chuyên môn",
      skills: "Kỹ năng cần thiết",
      attitude: "Thái độ và phẩm chất",
      kpis: "Kết quả chuyên môn",
      authority: "Quyền hạn",
      relationships: "Quan hệ công việc",
      careerPath: "Lộ trình phát triển",
      benefitsIncome: "Thu nhập",
      benefitsPerks: "Phúc lợi",
      salaryMin: "Lương tối thiểu",
      salaryMax: "Lương tối đa",
      currency: "Đơn vị tiền tệ",
      applicationDeadline: "Hạn nộp hồ sơ",
    };
    return {
      field,
      label: fieldLabels[field] || field,
      message: error?.message || "Dữ liệu không hợp lệ",
    };
  });
  const showValidationSummary = submitCount > 0 && validationErrorList.length > 0;

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

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Sanitize all HTML fields
      const payload = {
        title: values.title.trim(),
        locations: values.locations || [],
        remote: values.remote ?? false,
        employmentType: values.employmentType,
        experienceLevel: values.experienceLevel,
        salaryMin: values.salaryMin ? Number(values.salaryMin) : undefined,
        salaryMax: values.salaryMax ? Number(values.salaryMax) : undefined,
        currency: values.currency || "VND",
        applicationDeadline: values.applicationDeadline ? new Date(values.applicationDeadline).toISOString() : undefined,
        tags: values.tags || [],
        // Header fields (optional)
        department: values.department?.trim() || undefined,
        jobLevel: values.jobLevel || undefined,
        educationLevel: values.educationLevel || undefined,
        // Optional/required fields - sanitize HTML
        generalInfo: values.generalInfo ? sanitizeHtml(values.generalInfo) : undefined,
        mission: sanitizeHtml(values.mission),
        tasks: sanitizeHtml(values.tasks),
        knowledge: sanitizeHtml(values.knowledge),
        skills: sanitizeHtml(values.skills),
        attitude: sanitizeHtml(values.attitude),
        // Optional fields
        kpis: values.kpis ? sanitizeHtml(values.kpis) : undefined,
        authority: values.authority ? sanitizeHtml(values.authority) : undefined,
        relationships: values.relationships ? sanitizeHtml(values.relationships) : undefined,
        careerPath: values.careerPath ? sanitizeHtml(values.careerPath) : undefined,
        benefitsIncome: values.benefitsIncome?.trim() || undefined,
        benefitsPerks: values.benefitsPerks ? sanitizeHtml(values.benefitsPerks) : undefined,
      };

      await api.post(`/api/jobs/companies/${companyId}/jobs`, payload);
      toast.success("Đăng job mới thành công");
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      const err = error?.response?.data?.error;
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
        toast.error(err?.message ?? "Đăng job thất bại, vui lòng thử lại");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setExpandedSections(new Set(["basic", "mission", "tasks", "ksa"]));
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
      NO_EXPERIENCE: "Không yêu cầu kinh nghiệm",
      LT_1_YEAR: "Dưới 1 năm",
      Y1_2: "1 - 2 năm",
      Y2_3: "2 - 3 năm",
      Y3_5: "3 - 5 năm",
      Y5_10: "5 - 10 năm",
      GT_10: "Trên 10 năm",
    };
    return map[l] || l;
  };

  const translateJobLevel = (l: (typeof jobLevels)[number]) => {
    const map: Record<string, string> = {
      INTERN_STUDENT: "Thực tập sinh / Sinh viên",
      FRESH_GRAD: "Mới tốt nghiệp",
      EMPLOYEE: "Nhân viên",
      SPECIALIST_TEAM_LEAD: "Chuyên viên / Trưởng nhóm",
      MANAGER_HEAD: "Quản lý / Trưởng phòng",
      DIRECTOR: "Giám đốc",
      EXECUTIVE: "Điều hành",
    };
    return map[l] || l;
  };

  const translateEducationLevel = (l: (typeof educationLevels)[number]) => {
    const map: Record<string, string> = {
      NONE: "Không yêu cầu",
      HIGH_SCHOOL: "Trung học phổ thông",
      COLLEGE: "Cao đẳng",
      BACHELOR: "Đại học",
      MASTER: "Thạc sĩ",
      PHD: "Tiến sĩ",
    };
    return map[l] || l;
  };

  // Scroll to top when modal opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        // Find all scrollable containers and scroll to top
        const scrollContainers = document.querySelectorAll('.overflow-y-auto');
        scrollContainers.forEach((container) => {
          const rect = container.getBoundingClientRect();
          // Check if this container is visible (likely the modal scroll container)
          if (rect.top >= 0 && rect.top < window.innerHeight) {
            (container as HTMLElement).scrollTop = 0;
          }
        });
      }, 150);
    }
  }, [open]);

  // Handle auto-scroll to error when form submit fails
  useEffect(() => {
    if (isSubmitted && !Object.keys(errors).length) return;
    
    if (Object.keys(errors).length > 0 && submitCount > 0) {
      const errorFields = Object.keys(errors);
      const firstErrorField = errorFields[0];
      
      // Expand the section containing the error
      const sectionMap: Record<string, string> = {
        title: "basic", locations: "basic", employmentType: "basic", experienceLevel: "basic",
        salaryMin: "basic", salaryMax: "basic", currency: "basic", applicationDeadline: "basic", tags: "basic",
        department: "basic", jobLevel: "basic", educationLevel: "basic",
        mission: "mission",
        tasks: "tasks",
        kpis: "kpis",
        knowledge: "ksa", skills: "ksa", attitude: "ksa",
        authority: "authority",
        relationships: "relationships",
        careerPath: "careerPath",
        benefitsIncome: "benefits", benefitsPerks: "benefits",
        generalInfo: "general",
      };
      
      const section = sectionMap[firstErrorField];
      if (section) {
        setExpandedSections((prev) => {
          const next = new Set(prev);
          next.add(section);
          return next;
        });
      }

      // Scroll to the error field with a slight delay to allow expansion
      setTimeout(() => {
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`) || 
                           document.querySelector(`[data-field="${firstErrorField}"]`);
        
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
          // Try to focus
          if (errorElement instanceof HTMLInputElement || errorElement instanceof HTMLTextAreaElement) {
            errorElement.focus();
          } else {
             const contentEditable = errorElement.querySelector('[contenteditable="true"]');
             if (contentEditable instanceof HTMLElement) {
               contentEditable.focus();
             }
          }
        }
      }, 100);
    }
  }, [submitCount, errors, isSubmitted]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isSubmitting && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Đăng tin tuyển dụng mới</DialogTitle>
          <DialogDescription className="text-slate-500">
            Điền đầy đủ thông tin để tạo JD chuẩn. Các trường có dấu <span className="text-red-500">*</span> là bắt buộc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">

          {/* Validation Errors Summary */}
          {showValidationSummary && (
            <div className="mb-6 rounded-lg border-2 border-red-500 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-800 mb-2">Vui lòng kiểm tra lại các trường sau:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    {validationErrorList.map((err, idx) => (
                      <li key={idx}>
                        <span className="font-medium">{err.label}:</span> {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

            <form 
              onSubmit={handleSubmit(onSubmit)} 
              className="space-y-4"
            >
            {/* Section 1: Thông tin cơ bản (Header Section) */}
            <FormSection
              title="1. Thông tin cơ bản"
              description="Thông tin này sẽ hiển thị ở phần đầu của JD, giúp ứng viên nhanh chóng nắm bắt thông tin chính"
              isExpanded={expandedSections.has("basic")}
              onToggle={() => toggleSection("basic")}
            >
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>💡 Gợi ý:</strong> Các thông tin này sẽ được hiển thị dạng badge/icons ở phần header của JD, giúp ứng viên dễ dàng tìm kiếm và lọc việc làm.
                </p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Tiêu đề vị trí" error={errors.title?.message} required>
                  <Input 
                    placeholder="Ví dụ: Senior Frontend Developer" 
                    {...register("title")} 
                    className={errors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                </FormField>
                <FormField label="Bộ phận" error={errors.department?.message}>
                  <Input 
                    placeholder="Ví dụ: Kỹ thuật, Kinh doanh, Marketing..." 
                    {...register("department")}
                    className={errors.department ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                </FormField>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Địa điểm làm việc" error={errors.locations?.message}>
                  <ProvinceSelect
                    multiple
                    values={watch("locations") || []}
                    onChangeValues={(vals) => setValue("locations", vals, { shouldDirty: true })}
                  />
                </FormField>
                <FormField label="Hình thức làm việc">
                  <select {...register("employmentType")} className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm">
                    {employmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {translateEmploymentType(type)}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Mức lương tối thiểu" error={errors.salaryMin?.message}>
                  <Input 
                    type="number"
                    placeholder="VD: 10000000" 
                    {...register("salaryMin")}
                    className={errors.salaryMin ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                </FormField>
                <FormField label="Mức lương tối đa" error={errors.salaryMax?.message}>
                  <Input 
                    type="number"
                    placeholder="VD: 20000000" 
                    {...register("salaryMax")}
                    className={errors.salaryMax ? "border-red-500 focus-visible:ring-red-500" : ""}
                  />
                </FormField>
                <FormField label="Đơn vị tiền tệ" error={errors.currency?.message}>
                  <select
                    {...register("currency")}
                    className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm"
                  >
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </FormField>
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <FormField label="Kinh nghiệm yêu cầu">
                  <select {...register("experienceLevel")} className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm">
                    {experienceLevels.map((level) => (
                      <option key={level} value={level}>
                        {translateExperienceLevel(level)}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Cấp bậc">
                  <select {...register("jobLevel")} className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm">
                    <option value="">-- Chọn cấp bậc --</option>
                    {jobLevels.map((level) => (
                      <option key={level} value={level}>
                        {translateJobLevel(level)}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Học vấn">
                  <select {...register("educationLevel")} className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm">
                    <option value="">-- Chọn học vấn --</option>
                    {educationLevels.map((level) => (
                      <option key={level} value={level}>
                        {translateEducationLevel(level)}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
              
              <div className="grid gap-4 md:grid-cols-1">
                <FormField label="Hạn nộp hồ sơ" error={errors.applicationDeadline?.message}>
                  <Input type="date" {...register("applicationDeadline")} />
                </FormField>
              </div>
            </FormSection>

            {/* Section 2: Sứ mệnh / Vai trò tổng quát */}
            <FormSection
              title="2. Sứ mệnh / Vai trò tổng quát"
              description="Mô tả tổng quan về vai trò và đóng góp của vị trí này. Nội dung sẽ được hiển thị với background màu xám nhạt và chữ in nghiêng để nổi bật."
              isExpanded={expandedSections.has("mission")}
              onToggle={() => toggleSection("mission")}
              required
            >
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  <strong>💡 Gợi ý:</strong> Viết bằng văn phong tự nhiên, mô tả sứ mệnh và vai trò tổng quát. Ví dụ: "Đóng góp giá trị vào mục tiêu chung của công ty trong việc lan tỏa triết lý..."
                </p>
              </div>
              <FormField label="Mô tả sứ mệnh và vai trò của vị trí" error={errors.mission?.message} required>
                <div data-field="mission">
                  <Controller
                    name="mission"
                    control={control}
                    render={({ field }) => (
                      <TiptapEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={`Đóng góp giá trị vào mục tiêu chung của công ty trong việc lan tỏa triết lý "Quản trị đúng" và "đi làm là phải vui" đến doanh nghiệp Việt Nam.

Lãnh đạo mảng cộng đồng, kết nối, chăm lo và phát triển cộng đồng các nhà quản lý, người đi làm - những người cùng niềm tin về công việc hạnh phúc.`}
                        className={errors.mission ? "border-red-500" : ""}
                      />
                    )}
                  />
                </div>
              </FormField>
            </FormSection>

            {/* Section 3: Nhiệm vụ chuyên môn */}
            <FormSection
              title="3. Nhiệm vụ chuyên môn"
              description="Liệt kê chi tiết các nhiệm vụ và trách nhiệm chính của vị trí. Có thể nhóm theo từng nhóm nhiệm vụ để dễ đọc."
              isExpanded={expandedSections.has("tasks")}
              onToggle={() => toggleSection("tasks")}
              required
            >
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  <strong>💡 Gợi ý:</strong> Sử dụng bullet points để liệt kê. Có thể nhóm nhiệm vụ theo từng nhóm (ví dụ: "Nhóm nhiệm vụ phát triển cộng đồng", "Nhóm nhiệm vụ vận hành cộng đồng").
                </p>
              </div>
              <FormField label="Mô tả chi tiết nhiệm vụ và trách nhiệm" error={errors.tasks?.message} required>
                <div data-field="tasks">
                  <Controller
                    name="tasks"
                    control={control}
                    render={({ field }) => (
                      <TiptapEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={`Nhóm nhiệm vụ phát triển cộng đồng:
• Phát triển thành viên các cộng đồng
• Tạo ra môi trường, hoạt động để thành viên có thể cùng tham gia

Nhóm nhiệm vụ vận hành cộng đồng:
• Xây dựng và thực hiện các hoạt động cộng đồng
• Thúc đẩy tương tác, thảo luận trong cộng đồng`}
                        className={errors.tasks ? "border-red-500" : ""}
                      />
                    )}
                  />
                </div>
              </FormField>
            </FormSection>

            {/* Section 4: Kết quả chuyên môn cần đạt */}
            <FormSection
              title="4. Kết quả chuyên môn cần đạt"
              description="Mô tả các KPI/OKR mà vị trí này cần đạt được. Trên trang hiển thị sẽ có thông báo về quản trị bằng mục tiêu và OKRs."
              isExpanded={expandedSections.has("kpis")}
              onToggle={() => toggleSection("kpis")}
            >
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-600">
                  <strong>ℹ️ Lưu ý:</strong> Trên trang hiển thị JD sẽ tự động thêm dòng: "Công ty vận hành theo hướng quản trị bằng mục tiêu. Vị trí này sẽ cùng CEO/Quản lý xây dựng và thỏa thuận OKRs theo từng chu kỳ."
                </p>
              </div>
              <FormField label="Mô tả các KPI/OKR cần đạt" error={errors.kpis?.message}>
                <Controller
                  name="kpis"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={`• Số lượng và chất lượng thành viên các cộng đồng
• Tỷ lệ thành viên hoạt động và tương tác
• Doanh thu từ cộng đồng
• Số lượng và chất lượng sự kiện/hội thảo được tổ chức`}
                    />
                  )}
                />
              </FormField>
            </FormSection>

            {/* Section 5: Yêu cầu (KSA) */}
            <FormSection
              title="5. Yêu cầu (KSA - Knowledge, Skills, Attitude)"
              description="Mô tả chi tiết các yêu cầu về Kiến thức, Kỹ năng và Thái độ. Trên trang hiển thị sẽ được chia thành 3 cột với icon tương ứng."
              isExpanded={expandedSections.has("ksa")}
              onToggle={() => toggleSection("ksa")}
              required
            >
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">
                  <strong>💡 Gợi ý:</strong> Kiến thức sẽ hiển thị full width ở trên, Kỹ năng và Thái độ sẽ hiển thị 2 cột bên dưới. Sử dụng bullet points để liệt kê rõ ràng.
                </p>
              </div>
              <div className="space-y-4">
                <FormField label="Kiến thức chuyên môn" error={errors.knowledge?.message} required>
                  <div data-field="knowledge">
                    <Controller
                      name="knowledge"
                      control={control}
                      render={({ field }) => (
                        <TiptapEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={`• Có kinh nghiệm tối thiểu trong việc phát triển, quản lý cộng đồng
• Ưu tiên đã có kinh nghiệm quản lý cộng đồng kinh doanh, doanh nghiệp
• Hiểu biết về điều phối, dẫn dắt thảo luận cộng đồng
• Hiểu biết về MBO, OKRs là lợi thế`}
                          className={errors.knowledge ? "border-red-500" : ""}
                        />
                      )}
                    />
                  </div>
                </FormField>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Kỹ năng cần thiết" error={errors.skills?.message} required>
                    <div data-field="skills">
                      <Controller
                        name="skills"
                        control={control}
                        render={({ field }) => (
                          <TiptapEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={`• Khả năng lập và kiểm soát kế hoạch tốt
• Làm việc đa tác vụ
• Tư duy chiến lược, khả năng nhìn bao quát`}
                            className={errors.skills ? "border-red-500" : ""}
                          />
                        )}
                      />
                    </div>
                  </FormField>
                  <FormField label="Thái độ và phẩm chất" error={errors.attitude?.message} required>
                    <div data-field="attitude">
                      <Controller
                        name="attitude"
                        control={control}
                        render={({ field }) => (
                          <TiptapEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={`• Phù hợp với văn hóa và 5 giá trị cốt lõi công ty
• Đam mê tạo ra giá trị, muốn mang lại điều tốt đẹp cho người khác
• Tinh thần phụng sự`}
                            className={errors.attitude ? "border-red-500" : ""}
                          />
                        )}
                      />
                    </div>
                  </FormField>
                </div>
              </div>
            </FormSection>

            {/* Section 6: Quyền hạn và phạm vi ra quyết định */}
            <FormSection
              title="6. Quyền hạn và phạm vi ra quyết định"
              description="Mô tả các quyền hạn và phạm vi ra quyết định của vị trí. Trên trang hiển thị sẽ có tiêu đề phụ 'Có thể tự quyết:'."
              isExpanded={expandedSections.has("authority")}
              onToggle={() => toggleSection("authority")}
            >
              <FormField label="Mô tả quyền hạn" error={errors.authority?.message}>
                <Controller
                  name="authority"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={`• Kế hoạch hoạt động hàng ngày của cộng đồng
• Nội dung và hình thức tương tác với thành viên
• Điều phối các hoạt động trong phạm vi được giao`}
                    />
                  )}
                />
              </FormField>
            </FormSection>

            {/* Section 7: Quan hệ công việc */}
            <FormSection
              title="7. Quan hệ công việc"
              description="Mô tả các mối quan hệ nội bộ và bên ngoài mà vị trí này cần làm việc cùng."
              isExpanded={expandedSections.has("relationships")}
              onToggle={() => toggleSection("relationships")}
            >
              <FormField label="Mô tả quan hệ nội bộ và bên ngoài" error={errors.relationships?.message}>
                <Controller
                  name="relationships"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={`Quan hệ nội bộ:
• CEO Mai Xuân Đạt - nhận định hướng và báo cáo trực tiếp
• Nhóm chuyên môn (đào tạo, huấn luyện) - để tạo nội dung giá trị

Quan hệ bên ngoài:
• Thành viên các cộng đồng (Quản trị Quán, học viên/khách hàng, độc giả)`}
                    />
                  )}
                />
              </FormField>
            </FormSection>

            {/* Section 8: Lộ trình phát triển */}
            <FormSection
              title="8. Lộ trình phát triển"
              description="Mô tả các hướng phát triển nghề nghiệp cho vị trí này. Trên trang hiển thị sẽ có dòng giới thiệu về phát triển theo năng lực."
              isExpanded={expandedSections.has("careerPath")}
              onToggle={() => toggleSection("careerPath")}
            >
              <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-600">
                  <strong>ℹ️ Lưu ý:</strong> Trên trang hiển thị JD sẽ tự động thêm dòng: "Tùy thuộc vào năng lực và nguyện vọng cá nhân, có thể phát triển theo hướng:"
                </p>
              </div>
              <FormField label="Mô tả lộ trình phát triển" error={errors.careerPath?.message}>
                <Controller
                  name="careerPath"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={`• Xây dựng và quản lý team khi cộng đồng phát triển
• Mở rộng phạm vi quản lý sang các mảng khác của công ty`}
                    />
                  )}
                />
              </FormField>
            </FormSection>

            {/* Section 9: Quyền lợi */}
            <FormSection
              title="9. Quyền lợi"
              description="Mô tả thu nhập và các phúc lợi. Thu nhập sẽ được hiển thị nổi bật với font lớn và màu brand."
              isExpanded={expandedSections.has("benefits")}
              onToggle={() => toggleSection("benefits")}
            >
              <FormField label="Thu nhập" error={errors.benefitsIncome?.message}>
                <Input placeholder="15 - 25 triệu++, sẵn sàng trả mức lương xứng đáng..." {...register("benefitsIncome")} />
                <p className="text-xs text-slate-500 mt-1">Nếu không điền, hệ thống sẽ tự động hiển thị mức lương từ các trường trên hoặc "Thoả thuận"</p>
              </FormField>
              <FormField label="Chế độ, phúc lợi" error={errors.benefitsPerks?.message}>
                <Controller
                  name="benefitsPerks"
                  control={control}
                  render={({ field }) => (
                    <TiptapEditor
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={`• Làm việc linh hoạt ở bất cứ đâu (Công ty vận hành theo hướng quản trị bằng mục tiêu)
• Được tiếp cận và học hỏi trực tiếp từ CEO về quản trị
• Môi trường làm việc với triết lý "đi làm là phải vui"`}
                    />
                  )}
                />
              </FormField>
            </FormSection>

            {/* Section 10: Thông tin bổ sung */}
            <FormSection
              title="10. Thông tin bổ sung"
              description="Thông tin bổ sung về vị trí (tên vị trí, báo cáo cho ai, v.v.). Section này sẽ hiển thị ở cuối trang JD."
              isExpanded={expandedSections.has("general")}
              onToggle={() => toggleSection("general")}
            >
              <FormField label="Nhập thông tin bổ sung (Bộ phận, Báo cáo cho...)" error={errors.generalInfo?.message}>
                <div data-field="generalInfo">
                  <Controller
                    name="generalInfo"
                    control={control}
                    render={({ field }) => (
                      <TiptapEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder={`● Tên vị trí: Phụ trách Phát triển Cộng đồng
● Bộ phận: Cộng đồng
● Báo cáo cho: CEO Mai Xuân Đạt (trực tiếp)`}
                        className={errors.generalInfo ? "border-red-500" : ""}
                      />
                    )}
                  />
                </div>
              </FormField>
            </FormSection>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs text-amber-800">
                Sau 20 ngày kể từ lần tạo hoặc chỉnh sửa gần nhất, nếu bạn không thực hiện thêm thao tác nào, hệ thống sẽ tự động đóng việc làm và ẩn khỏi danh sách hiển thị. Để duy trì hiển thị, bạn có thể cập nhật việc làm hoặc bấm nút "Làm mới".
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Huỷ
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang đăng..." : "Đăng tin tuyển dụng"}
              </Button>
            </div>
            </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormSection({
  title,
  description,
  isExpanded,
  onToggle,
  required,
  children,
}: {
  title: string;
  description?: string;
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
        className="w-full flex items-center justify-between p-4 bg-[var(--muted)]/50 hover:bg-[var(--muted)] transition-colors text-left"
      >
        <div className="flex-1">
          <span className="font-semibold text-[var(--foreground)] block">
            {title}
            {required && <span className="ml-1 text-red-500">*</span>}
          </span>
          {description && (
            <p className="text-xs text-[var(--muted-foreground)] mt-1">{description}</p>
          )}
        </div>
        {isExpanded ? <ChevronDown className="h-5 w-5 shrink-0 ml-2" /> : <ChevronRight className="h-5 w-5 shrink-0 ml-2" />}
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
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
