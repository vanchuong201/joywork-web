"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Mã xác thực không hợp lệ");
      return;
    }

    const verifyEmail = async () => {
      try {
        await api.get("/api/auth/verify-email", {
          params: { token },
        });
        setStatus("success");
        setMessage("Email đã được xác thực thành công!");
      } catch (error: any) {
        setStatus("error");
        const errorMessage =
          error?.response?.data?.error?.message ?? "Không thể xác thực email. Vui lòng thử lại.";
        setMessage(errorMessage);
      }
    };

    void verifyEmail();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[var(--brand)]/10 flex items-center justify-center">
            {status === "loading" ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" />
            ) : status === "success" ? (
              <span className="text-3xl">✅</span>
            ) : (
              <span className="text-3xl">❌</span>
            )}
          </div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            {status === "loading"
              ? "Đang xác thực email..."
              : status === "success"
              ? "Xác thực thành công"
              : "Xác thực thất bại"}
          </h1>
          {message && (
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{message}</p>
          )}
        </div>

        {status === "success" && (
          <div className="space-y-3">
            <Button className="w-full" onClick={() => router.push("/")}>
              Về trang chủ
            </Button>
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full">
                Đăng nhập ngay
              </Button>
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <Button className="w-full" onClick={() => router.push("/")}>
              Về trang chủ
            </Button>
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full">
                Đăng nhập để gửi lại email xác thực
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-[var(--brand)]/10 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" />
              </div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">Đang tải...</h1>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

