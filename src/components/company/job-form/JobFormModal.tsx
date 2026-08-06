import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useForm, FormProvider, type DefaultValues, type Resolver } from "react-hook-form";
import { jobFormSchema, type JobFormValues } from "./job-form-schema";
import {
  FIELD_LABELS,
  SECTION_MAP,
  createInitialExpandedSections,
} from "./job-form-utils";
import { JobFormFields } from "./JobFormFields";

type JobFormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  submitLabel: string;
  submittingLabel: string;
  successMessage: string;
  fallbackErrorMessage: string;
  defaultValues: DefaultValues<JobFormValues>;
  onSubmit: (values: JobFormValues) => Promise<void>;
  onSuccess?: () => void;
};

type ServerFieldDetail = {
  path?: unknown;
  message?: string;
};

type ServerErrorPayload = {
  message?: string;
  details?: ServerFieldDetail[];
};

export function JobFormModal({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  submittingLabel,
  successMessage,
  fallbackErrorMessage,
  defaultValues,
  onSubmit,
  onSuccess,
}: JobFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(createInitialExpandedSections);

  const resolver: Resolver<JobFormValues> = async (values) => {
    const result = jobFormSchema.safeParse(values);
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

  const methods = useForm<JobFormValues>({
    resolver,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues,
  });

  const {
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, submitCount, isSubmitted },
  } = methods;

  const locationSelected = watch("location");
  const wardCodeValue = watch("wardCode");

  const validationErrorList = Object.keys(errors).map((field) => {
    const error = errors[field as keyof typeof errors];
    return {
      field,
      label: FIELD_LABELS[field] || field,
      message: (error?.message as string | undefined) || "Dữ liệu không hợp lệ",
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

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
    setExpandedSections(createInitialExpandedSections());
  }, [defaultValues, open, reset]);

  useEffect(() => {
    if (locationSelected && wardCodeValue && !wardCodeValue.startsWith(`${locationSelected}/`)) {
      setValue("wardCode", "", { shouldDirty: true });
    }
  }, [locationSelected, setValue, wardCodeValue]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      const scrollContainers = document.querySelectorAll(".overflow-y-auto");
      scrollContainers.forEach((container) => {
        const rect = container.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < window.innerHeight) {
          (container as HTMLElement).scrollTop = 0;
        }
      });
    }, 150);
  }, [open]);

  useEffect(() => {
    if (isSubmitted && !Object.keys(errors).length) return;

    if (Object.keys(errors).length > 0 && submitCount > 0) {
      const firstErrorField = Object.keys(errors)[0];
      const section = SECTION_MAP[firstErrorField];
      if (section) {
        setExpandedSections((prev) => {
          const next = new Set(prev);
          next.add(section);
          return next;
        });
      }

      setTimeout(() => {
        const errorElement = document.querySelector(`[name="${firstErrorField}"]`) ||
          document.querySelector(`[data-field="${firstErrorField}"]`);

        if (!errorElement) return;
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });

        if (errorElement instanceof HTMLInputElement || errorElement instanceof HTMLTextAreaElement) {
          errorElement.focus();
          return;
        }

        const contentEditable = errorElement.querySelector('[contenteditable="true"]');
        if (contentEditable instanceof HTMLElement) {
          contentEditable.focus();
        }
      }, 100);
    }
  }, [errors, isSubmitted, submitCount]);

  const handleClose = () => {
    if (isSubmitting) return;
    reset(defaultValues);
    setExpandedSections(createInitialExpandedSections());
    onOpenChange(false);
  };

  const submitForm = async (values: JobFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      toast.success(successMessage);
      onSuccess?.();
      handleClose();
    } catch (error: unknown) {
      const err = (error as { response?: { data?: { error?: ServerErrorPayload } } })?.response?.data?.error;
      const details = err?.details;
      if (Array.isArray(details)) {
        for (const detail of details) {
          const path = Array.isArray(detail?.path) ? detail.path : [];
          const field = path[0];
          const message = detail?.message || err?.message || "Dữ liệu không hợp lệ";
          if (typeof field === "string") {
            setError(field as keyof JobFormValues, { type: "server", message });
          }
        }
      } else {
        toast.error(err?.message ?? fallbackErrorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !isSubmitting && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-white sm:p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-slate-500">
            {description}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <div className="space-y-4 py-6">
            {showValidationSummary ? (
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
                      {validationErrorList.map((item, idx) => (
                        <li key={`${item.field}-${idx}`}>
                          <span className="font-medium">{item.label}:</span> {item.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleSubmit(submitForm)} className="space-y-4">
              <JobFormFields
                expandedSections={expandedSections}
                onToggle={toggleSection}
              />

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-800">
                  Sau 20 ngày kể từ lần tạo hoặc chỉnh sửa gần nhất, nếu bạn không thực hiện thêm thao tác nào, hệ thống sẽ tự động đóng việc làm và ẩn khỏi danh sách hiển thị. Để duy trì hiển thị, bạn có thể cập nhật việc làm hoặc bấm nút “Làm mới”.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Huỷ
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? submittingLabel : submitLabel}
                </Button>
              </div>
            </form>
          </div>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
