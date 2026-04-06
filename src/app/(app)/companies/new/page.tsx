"use client";

import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuth";
import { useMemo, useState, useEffect } from "react";
import IndustrySelect from "@/components/ui/industry-select";
import { COMPANY_INDUSTRY_SET } from "@/lib/company-industries";

const schema = z.object({
  name: z.string().min(2, "Tên doanh nghiệp cần ít nhất 2 ký tự"),
  legalName: z.string().min(2, "Tên pháp lý đầy đủ cần ít nhất 2 ký tự").max(200, "Tên pháp lý tối đa 200 ký tự"),
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
    clearErrors,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { name: "", legalName: "", slug: "", tagline: "", industry: undefined, description: "" },
  });

  const nameField = register("name");
  const slugField = register("slug");

  const nameValue = watch("name");
  const legalNameValue = watch("legalName");
  const slugValue = watch("slug");
  const sanitizedSlugValue = useMemo(() => slugify(slugValue || ""), [slugValue, slugify]);
  const isFormValid = useMemo(() => {
    const nameValid = (nameValue || "").trim().length >= 2;
    const legalNameValid = (legalNameValue || "").trim().length >= 2;
    const slugValid = sanitizedSlugValue.length >= 2 && /^[a-z0-9-]+$/.test(sanitizedSlugValue);
    const hasErrors = Boolean(errors.name) || Boolean(errors.legalName) || Boolean(errors.slug);
    return nameValid && legalNameValid && slugValid && !hasErrors;
  }, [nameValue, legalNameValue, sanitizedSlugValue, errors.name, errors.legalName, errors.slug]);

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
      const { industry, ...rest } = values;
      const payload = {
        ...rest,
        slug: sanitizedSlug,
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
            className="mt-1"
            placeholder="Ví dụ: JOYWORK Studio"
            {...nameField}
            onChange={(event) => {
              nameField.onChange(event).catch(() => {});
              const v = (event.target.value || "").trim();
              if (v.length >= 2) {
                clearErrors("name");
              }
            }}
            onBlur={(event) => {
              nameField.onBlur(event).catch(() => {});
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
          <label className="text-sm font-medium text-[var(--foreground)]">Tên pháp lý đầy đủ *</label>
          <Input
            className="mt-1"
            placeholder="Ví dụ: Công ty Cổ phần Công nghệ..."
            {...register("legalName")}
          />
          {errors.legalName ? <p className="mt-1 text-sm text-red-500">{errors.legalName.message}</p> : null}
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--foreground)]">Slug (đường dẫn) *</label>
          <Input
            className="mt-1"
            placeholder="ví dụ: joywork-studio"
            {...slugField}
            value={slugValue}
            onChange={(event) => {
              slugField.onChange(event).catch(() => {});
              setSlugManuallyEdited(true);
              const sanitized = slugify(event.target.value, { trimEdge: false });
              setValue("slug", sanitized, { shouldDirty: true, shouldTouch: true, shouldValidate: false });
              if (/^[a-z0-9-]*$/.test(sanitized)) {
                clearErrors("slug");
              }
            }}
            onBlur={(event) => {
              slugField.onBlur(event).catch(() => {});
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
          <label htmlFor="create-company-industry" className="text-sm font-medium text-[var(--foreground)]">
            Lĩnh vực hoạt động (tuỳ chọn)
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
              Giúp ứng viên và đối tác hiểu rõ ngành nghề chính của doanh nghiệp.
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--foreground)]">Mô tả chi tiết</label>
          <Textarea className="mt-1" placeholder="Giới thiệu về sứ mệnh, sản phẩm, văn hoá..." rows={5} {...register("description")} />
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


