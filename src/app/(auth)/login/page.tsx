"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuth";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email")
    .email("Vui lòng nhập email hợp lệ"),
  password: z.string().min(6, "Mật khẩu cần ít nhất 6 ký tự"),
});

type FormValues = z.infer<typeof schema>;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ mode: "onSubmit", reValidateMode: "onChange" });

  const watchedEmail = watch("email");
  const watchedPassword = watch("password");

  useEffect(() => {
    if (serverError) {
      setServerError(null);
    }
  }, [watchedEmail, watchedPassword, serverError]);

  const onSubmit = async (values: FormValues) => {
    // Validate với Zod trước khi call API
    const result = schema.safeParse(values);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      if (firstIssue?.path[0]) {
        const field = firstIssue.path[0] as keyof FormValues;
        setError(field, {
          type: "manual",
          message: firstIssue.message,
        });
      }
      setServerError(firstIssue?.message ?? "Dữ liệu không hợp lệ");
      toast.error(firstIssue?.message ?? "Dữ liệu không hợp lệ");
      return;
    }

    setServerError(null);
    try {
      const { data } = await api.post("/api/auth/login", result.data);
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.data.accessToken);
      }
      await fetchMe();
      toast.success("Đăng nhập thành công");
      
      // Redirect về trang được chỉ định hoặc trang chủ
      const redirectUrl = searchParams.get("redirect");
      const safeRedirect = redirectUrl && redirectUrl.startsWith("/") ? redirectUrl : "/";
      router.push(safeRedirect);
    } catch (error: any) {
      const customError = extractDetailedValidation(error);
      if (customError) {
        setError(customError.field as keyof FormValues, { message: customError.message });
        toast.error(customError.message);
      } else {
        const message = extractApiErrorMessage(error, "Email hoặc mật khẩu không chính xác");
        setServerError(message);
        toast.error(message);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 h-10 w-10 rounded-md bg-[var(--brand)]" />
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Đăng nhập JoyWork</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Nhập thông tin để tiếp tục</p>
        </div>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Email" error={errors.email?.message}>
            <Input
              placeholder="example@joywork.vn"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              className={cn(errors.email ? "border-red-500 focus-visible:ring-red-500" : undefined)}
              {...register("email")}
            />
          </FormField>
          <FormField label="Mật khẩu" error={errors.password?.message}>
            <Input
              placeholder="••••••"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              className={cn(errors.password ? "border-red-500 focus-visible:ring-red-500" : undefined)}
              {...register("password")}
            />
          </FormField>
          {serverError ? <p className="text-sm text-red-500">{serverError}</p> : null}
          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          Chưa có tài khoản?{" "}
          <a
            className="text-[var(--brand)] underline-offset-2 hover:underline"
            href={`/register${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`}
          >
            Đăng ký ngay
          </a>
        </div>
      </div>
    </div>
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

function extractApiErrorMessage(error: any, fallback: string) {
  const apiError = error?.response?.data?.error;
  if (apiError) {
    const details = apiError.details;
    if (Array.isArray(details)) {
      const detailWithMessage = details.find((detail) => typeof detail?.message === "string");
      if (detailWithMessage?.message) return detailWithMessage.message as string;
    }
    if (typeof apiError.message === "string") {
      return apiError.message;
    }
  }
  if (error?.message && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

function extractDetailedValidation(error: any): { field: string; message: string } | null {
  const details = error?.response?.data?.error?.details;
  if (Array.isArray(details)) {
    const entry = details.find(
      (detail) => detail?.path && Array.isArray(detail.path) && typeof detail.path[0] === "string" && detail.message,
    );
    if (entry) {
      return {
        field: entry.path[0],
        message: String(entry.message),
      };
    }
  }
  return null;
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 h-10 w-10 rounded-md bg-[var(--brand)]" />
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Đăng nhập JoyWork</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Đang tải...</p>
          </div>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

