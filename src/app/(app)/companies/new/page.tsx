"use client";

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuth";
import { useMemo, useState, useEffect } from "react";
import IndustrySelect from "@/components/ui/industry-select";
import { COMPANY_INDUSTRY_SET } from "@/lib/company-industries";

const schema = z.object({
  name: z.string().min(2, "Tên doanh nghiệp cần ít nhất 2 ký tự"),
  legalName: z.string().min(2, "Tên pháp lý đầy đủ cần ít nhất 2 ký tự").max(200, "Tên pháp lý tối đa 200 ký tự"),
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email doanh nghiệp")
    .max(200, "Email tối đa 200 ký tự")
    .refine((value) => value.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Email không đúng định dạng"),
  phone: z
    .string()
    .trim()
    .min(8, "Số điện thoại cần ít nhất 8 ký tự")
    .max(50, "Số điện thoại tối đa 50 ký tự"),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug chỉ được chứa chữ thường (không dấu), số và dấu gạch ngang")
    .min(2, "Slug cần ít nhất 2 ký tự"),
  tagline: z.string().optional(),
  industry: z.preprocess(
    (v) => (v === null || v === undefined || v === "" ? undefined : v),
    z
      .string()
      .refine((s) => COMPANY_INDUSTRY_SET.has(s), {
        message: "Vui lòng chọn lĩnh vực từ danh sách",
      })
      .optional()
  ),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateCompanyPage() {
  const router = useRouter();
  const { fetchMe } = useAuthStore();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [uploadingVerification, setUploadingVerification] = useState(false);

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
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { isSubmitting, errors, touchedFields, submitCount },
  } = useForm<FormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { name: "", legalName: "", email: "", phone: "", slug: "", tagline: "", industry: undefined, description: "" },
  });

  const nameField = register("name", {
    required: "Vui lòng nhập tên doanh nghiệp",
    minLength: { value: 2, message: "Tên doanh nghiệp cần ít nhất 2 ký tự" },
  });
  const legalNameField = register("legalName", {
    required: "Vui lòng nhập tên pháp lý đầy đủ",
    minLength: { value: 2, message: "Tên pháp lý đầy đủ cần ít nhất 2 ký tự" },
    maxLength: { value: 200, message: "Tên pháp lý tối đa 200 ký tự" },
  });
  const emailField = register("email", {
    required: "Vui lòng nhập email doanh nghiệp",
    maxLength: { value: 200, message: "Email tối đa 200 ký tự" },
    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email không đúng định dạng" },
  });
  const phoneField = register("phone", {
    required: "Vui lòng nhập số điện thoại doanh nghiệp",
    minLength: { value: 8, message: "Số điện thoại cần ít nhất 8 ký tự" },
    maxLength: { value: 50, message: "Số điện thoại tối đa 50 ký tự" },
  });
  const slugField = register("slug", {
    required: "Vui lòng nhập slug",
    minLength: { value: 2, message: "Slug cần ít nhất 2 ký tự" },
    pattern: {
      value: /^[a-z0-9-]+$/,
      message: "Slug chỉ được chứa chữ thường (không dấu), số và dấu gạch ngang",
    },
  });
  const showFieldError = (field: keyof FormValues) => Boolean(errors[field]) && (Boolean(touchedFields[field]) || submitCount > 0);

  const nameValue = watch("name");
  const legalNameValue = watch("legalName");
  const emailValue = watch("email");
  const phoneValue = watch("phone");
  const slugValue = watch("slug");
  const sanitizedSlugValue = useMemo(() => slugify(slugValue || ""), [slugValue, slugify]);
  const isFormValid = useMemo(() => {
    const nameValid = (nameValue || "").trim().length >= 2;
    const legalNameValid = (legalNameValue || "").trim().length >= 2;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((emailValue || "").trim());
    const phoneValid = (phoneValue || "").trim().length >= 8;
    const slugValid = sanitizedSlugValue.length >= 2 && /^[a-z0-9-]+$/.test(sanitizedSlugValue);
    const hasErrors = Boolean(errors.name) || Boolean(errors.legalName) || Boolean(errors.email) || Boolean(errors.phone) || Boolean(errors.slug);
    return nameValid && legalNameValid && emailValid && phoneValid && slugValid && !hasErrors;
  }, [nameValue, legalNameValue, emailValue, phoneValue, sanitizedSlugValue, errors.name, errors.legalName, errors.email, errors.phone, errors.slug]);

  useEffect(() => {
    if (!slugManuallyEdited) {
      const suggestion = slugify(nameValue || "");
      setValue("slug", suggestion, { shouldValidate: false });
    }
  }, [nameValue, slugManuallyEdited, slugify, setValue]);

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result?.toString() || "";
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitError(null);
      const sanitizedSlug = slugify(values.slug);
      const normalizedValues: FormValues = {
        ...values,
        name: values.name.trim(),
        legalName: values.legalName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        slug: sanitizedSlug,
      };

      const parsed = schema.safeParse(normalizedValues);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => {
          const field = issue.path[0];
          if (typeof field === "string" && field in normalizedValues) {
            setError(field as keyof FormValues, { type: "manual", message: issue.message });
          }
        });
        return;
      }

      const { industry, tagline: _tagline, description: _description, ...rest } = parsed.data;
      const payload = {
        ...rest,
        slug: parsed.data.slug,
        ...(industry ? { industry } : {}),
      };
      const { data } = await api.post("/api/companies", payload);
      const company = data.data.company;

      if (verificationFile) {
        setUploadingVerification(true);
        try {
          const fileData = await fileToBase64(verificationFile);
          await api.post("/api/uploads/company/verification-document", {
            companyId: company.id,
            fileName: verificationFile.name,
            fileType: verificationFile.type,
            fileData,
          });
        } finally {
          setUploadingVerification(false);
        }
      }
      await fetchMe();
      toast.success("Đã tạo doanh nghiệp");
      router.push(`/companies/${company.slug}/manage`);
    } catch (e: any) {
      const message = e?.response?.data?.error?.message ?? "Không thể tạo doanh nghiệp";
      setSubmitError(message);
      toast.error(message);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold text-[var(--foreground)]">Tạo hồ sơ doanh nghiệp</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        Hoàn thành các thông tin cơ bản bên dưới để xuất bản trang giới thiệu doanh nghiệp của bạn trên JOYWORK.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-[var(--foreground)]">Tên doanh nghiệp *</label>
          <Input
            className={showFieldError("name") ? "mt-1 border-red-500 focus-visible:ring-red-500" : "mt-1"}
            placeholder="Ví dụ: JOYWORK Studio"
            {...nameField}
          />
          {showFieldError("name") ? <p className="mt-1 text-sm text-red-500">{errors.name?.message}</p> : null}
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--foreground)]">Tên pháp lý đầy đủ *</label>
          <Input
            className={showFieldError("legalName") ? "mt-1 border-red-500 focus-visible:ring-red-500" : "mt-1"}
            placeholder="Ví dụ: Công ty Cổ phần Công nghệ..."
            {...legalNameField}
          />
          {showFieldError("legalName") ? <p className="mt-1 text-sm text-red-500">{errors.legalName?.message}</p> : null}
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--foreground)]">Email doanh nghiệp *</label>
          <Input
            className={showFieldError("email") ? "mt-1 border-red-500 focus-visible:ring-red-500" : "mt-1"}
            type="email"
            placeholder="contact@company.vn"
            {...emailField}
          />
          {showFieldError("email") ? <p className="mt-1 text-sm text-red-500">{errors.email?.message}</p> : null}
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--foreground)]">Số điện thoại doanh nghiệp *</label>
          <Input
            className={showFieldError("phone") ? "mt-1 border-red-500 focus-visible:ring-red-500" : "mt-1"}
            placeholder="Ví dụ: 0909 123 456"
            {...phoneField}
          />
          {showFieldError("phone") ? <p className="mt-1 text-sm text-red-500">{errors.phone?.message}</p> : null}
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--foreground)]">Slug (đường dẫn) *</label>
          <Input
            className={showFieldError("slug") ? "mt-1 border-red-500 focus-visible:ring-red-500" : "mt-1"}
            placeholder="ví dụ: joywork-studio"
            {...slugField}
            value={slugValue}
            onChange={(event) => {
              setSlugManuallyEdited(true);
              const sanitized = slugify(event.target.value, { trimEdge: false });
              setValue("slug", sanitized, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
            }}
            onBlur={() => {
              const trimmed = slugify(slugValue || "");
              setValue("slug", trimmed, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
            }}
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Đây là đường dẫn công khai tới trang công ty của bạn:&nbsp;
            <span className="font-medium text-[var(--foreground)]">
              https://joywork.vn/companies/{slugValue || "ten-doanh-nghiep"}
            </span>
          </p>
          {showFieldError("slug") ? (
            <p className="mt-1 text-sm text-red-500">
              {errors.slug?.message} (ví dụ: <code className="font-mono">joywork-studio</code>)
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Hãy dùng chữ thường, không dấu, thay khoảng trắng bằng dấu gạch ngang.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="create-company-industry" className="text-sm font-medium text-[var(--foreground)]">
            Lĩnh vực hoạt động
          </label>
          <Controller
            name="industry"
            control={control}
            render={({ field }) => (
              <div className="mt-1">
                <IndustrySelect
                  id="create-company-industry"
                  value={field.value ?? null}
                  onChange={(v) =>
                    setValue("industry", v ?? undefined, {
                      shouldValidate: false,
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                  }
                  placeholder="Chọn lĩnh vực theo danh sách chuẩn"
                />
              </div>
            )}
          />
          {errors.industry ? (
            <p className="mt-1 text-sm text-red-500">{errors.industry.message}</p>
          ) : (
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Có thể để trống. Giá trị cũ không nằm trong danh sách vẫn hiển thị cho đến khi bạn đổi.
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--foreground)]">Hồ sơ ĐKKD (tùy chọn)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setVerificationFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-[var(--muted-foreground)] file:mr-4 file:rounded-md file:border-0 file:bg-[var(--muted)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--foreground)] hover:file:bg-[var(--muted)]/80"
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Tải lên giấy phép ĐKKD để xác thực doanh nghiệp (PDF/JPG/PNG/DOC/DOCX, tối đa 15MB).
          </p>
        </div>

        {submitError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{submitError}</div>
        ) : null}
        <Button disabled={isSubmitting || uploadingVerification || !isFormValid} className="w-full md:w-auto">
          {isSubmitting || uploadingVerification ? "Đang tạo..." : "Tạo doanh nghiệp"}
        </Button>
      </form>
    </div>
  );
}


