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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

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

  // Lắng nghe kết quả đăng nhập mạng xã hội từ popup
  useEffect(() => {
    const handleLoginSuccess = () => {
      (async () => {
        try {
          await fetchMe();
          toast.success("Đăng nhập thành công");
          const redirectUrl = searchParams.get("redirect");
          const safeRedirect = redirectUrl && redirectUrl.startsWith("/") ? redirectUrl : "/";
          router.push(safeRedirect);
        } catch {
          toast.error("Không thể tải thông tin tài khoản sau khi đăng nhập");
        }
      })();
    };

    const handleLoginFailure = (message?: string) => {
      toast.error(message || "Đăng nhập mạng xã hội thất bại");
    };

    // 1. Listener cho postMessage (nếu window.opener còn sống)
    function handleMessage(event: MessageEvent) {
      if (typeof window === "undefined") return;
      if (event.origin !== window.location.origin) return;

      const data = event.data as any;
      if (!data || data.type !== "social-login-result") return;

      if (data.success) {
        handleLoginSuccess();
      } else {
        handleLoginFailure(data.message);
      }
    }

    // 2. Listener cho BroadcastChannel (nếu window.opener bị mất)
    const channel = new BroadcastChannel('social_login_channel');
    channel.onmessage = (event) => {
      const data = event.data;
      if (data?.type === "social-login-result") {
        if (data.success) {
          handleLoginSuccess();
        } else {
          handleLoginFailure(data.message);
        }
        // Đóng channel sau khi nhận tin để tránh duplicate (mặc dù component unmount sẽ close)
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("message", handleMessage);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("message", handleMessage);
      }
      channel.close();
    };
  }, [fetchMe, router, searchParams]);

  const openSocialPopup = (provider: "google" | "facebook") => {
    if (typeof window === "undefined") return;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const url = `${API_BASE_URL}/api/auth/${provider}/start?mode=popup`;
    const popup = window.open(
      url,
      `oauth-${provider}`,
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,status=no`
    );
    if (!popup) {
      toast.error("Trình duyệt đã chặn popup, vui lòng cho phép popup và thử lại");
    }
  };

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
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span>Hoặc</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => openSocialPopup("google")}
            >
              <span className="text-sm font-medium">Tiếp tục với Google</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => openSocialPopup("facebook")}
            >
              <span className="text-sm font-medium">Tiếp tục với Facebook</span>
            </Button>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-center text-sm text-[var(--muted-foreground)]">
          <div>
            Chưa có tài khoản?{" "}
            <a
              className="text-[var(--brand)] underline-offset-2 hover:underline"
              href={`/register${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect")!)}` : ""}`}
            >
              Đăng ký ngay
            </a>
          </div>
          <div>
            <a href="/forgot-password" className="text-[var(--brand)] underline-offset-2 hover:underline">
              Quên mật khẩu?
            </a>
          </div>
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

