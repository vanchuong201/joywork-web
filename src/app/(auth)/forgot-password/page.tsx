"use client";

import { Suspense, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

const schema = z.object({
  email: z
    .string()
    .min(1, "Vui lòng nhập email")
    .email("Vui lòng nhập email hợp lệ"),
});

type FormValues = z.infer<typeof schema>;

function ForgotPasswordContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ mode: "onSubmit", reValidateMode: "onChange" });

  const onSubmit = async (values: FormValues) => {
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
      await api.post("/api/auth/forgot-password", result.data);
      setIsSuccess(true);
      toast.success("Email đặt lại mật khẩu đã được gửi!");
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? "Không thể gửi email. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">Email đã được gửi</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn.
              Vui lòng kiểm tra hộp thư (bao gồm thư mục spam).
            </p>
          </div>
          <div className="space-y-3">
            <Link href="/login" className="block">
              <Button className="w-full">Quay lại đăng nhập</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <div className="relative h-12 w-48">
              <Image
                src="/JW-mid.png"
                alt="JoyWork Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Quên mật khẩu</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Nhập email của bạn để nhận link đặt lại mật khẩu
          </p>
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
          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-[var(--muted-foreground)]">
          Nhớ mật khẩu?{" "}
          <Link href="/login" className="text-[var(--brand)] underline-offset-2 hover:underline">
            Đăng nhập
          </Link>
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

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex justify-center">
                <div className="relative h-12 w-48">
                  <Image
                    src="/JW-mid.png"
                    alt="JoyWork Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">Quên mật khẩu</h1>
              <p className="text-sm text-[var(--muted-foreground)]">Đang tải...</p>
            </div>
          </div>
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}

