"use client";

import { Suspense, useState, useEffect, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuth";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

const schema = z
  .object({
    password: z.string().min(6, "Mật khẩu cần ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ mode: "onSubmit", reValidateMode: "onChange" });

  useEffect(() => {
    if (!token) {
      toast.error("Link đặt lại mật khẩu không hợp lệ");
      router.push("/forgot-password");
    }
  }, [token, router]);

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast.error("Link đặt lại mật khẩu không hợp lệ");
      return;
    }

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
      toast.error(firstIssue?.message ?? "Dữ liệu không hợp lệ");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post("/api/auth/reset-password", {
        token,
        newPassword: result.data.password,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.data.accessToken);
      }
      await fetchMe();
      toast.success("Mật khẩu đã được đặt lại thành công!");
      router.push("/");
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? "Không thể đặt lại mật khẩu. Vui lòng thử lại.";
      toast.error(message);
      if (error?.response?.data?.error?.code === "TOKEN_EXPIRED" || error?.response?.data?.error?.code === "INVALID_TOKEN") {
        setTimeout(() => {
          router.push("/forgot-password");
        }, 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 h-10 w-10 rounded-md bg-[var(--brand)]" />
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Đặt lại mật khẩu</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>
        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Mật khẩu mới" error={errors.password?.message}>
            <div className="relative">
              <Input
                placeholder="Ít nhất 6 ký tự"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                className={cn(
                  errors.password ? "border-red-500 focus-visible:ring-red-500" : undefined,
                  "pr-10"
                )}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>
          <FormField label="Xác nhận mật khẩu" error={errors.confirmPassword?.message}>
            <div className="relative">
              <Input
                placeholder="Nhập lại mật khẩu"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                className={cn(
                  errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : undefined,
                  "pr-10"
                )}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormField>
          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
          </Button>
        </form>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-2 h-10 w-10 rounded-md bg-[var(--brand)]" />
              <h1 className="text-xl font-semibold text-[var(--foreground)]">Đặt lại mật khẩu</h1>
              <p className="text-sm text-[var(--muted-foreground)]">Đang tải...</p>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

