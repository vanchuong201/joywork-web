"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { consumeCvFlipEmailAction } from "@/lib/api/cv-flip";
import { useAuthStore } from "@/store/useAuth";
import { Button } from "@/components/ui/button";

const consumePromises = new Map<
  string,
  Promise<{
    accessToken: string;
    action: "approve" | "reject" | "list";
    requestStatus?: "APPROVED" | "REJECTED";
  }>
>();

function consumeOnce(token: string) {
  const existing = consumePromises.get(token);
  if (existing) return existing;
  const promise = consumeCvFlipEmailAction(token);
  consumePromises.set(token, promise);
  return promise;
}

function FromEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const token = searchParams.get("token")?.trim() ?? "";
  const startedRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!token) {
      setErrorMessage("Link không hợp lệ.");
      return;
    }

    void (async () => {
      try {
        const result = await consumeOnce(token);
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", result.accessToken);
        }
        await fetchMe();

        if (result.action === "approve") {
          toast.success("Bạn đã đồng ý yêu cầu mở CV.");
        } else if (result.action === "reject") {
          toast.success("Bạn đã từ chối yêu cầu mở CV.");
        }

        router.replace("/connections");
      } catch (error) {
        const maybeAxiosError = error as {
          response?: { data?: { error?: { code?: string; message?: string } } };
        };
        const code = maybeAxiosError.response?.data?.error?.code;
        const message = maybeAxiosError.response?.data?.error?.message;
        if (code === "CV_FLIP_EMAIL_TOKEN_EXPIRED" || code === "CV_FLIP_REQUEST_EXPIRED") {
          setErrorMessage("Yêu cầu đã hết hạn.");
        } else if (code === "CV_FLIP_REQUEST_ALREADY_PROCESSED") {
          setErrorMessage("Yêu cầu đã được xử lý trước đó.");
        } else if (code === "ACCOUNT_SUSPENDED") {
          setErrorMessage("Tài khoản đã bị tạm khóa.");
        } else {
          setErrorMessage(message || "Không thể xử lý link từ email.");
        }
      }
    })();
  }, [token, fetchMe, router]);

  if (errorMessage) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4 md:p-6">
        <h1 className="text-xl font-bold">Không xử lý được yêu cầu</h1>
        <p className="text-sm text-[var(--muted-foreground)]">{errorMessage}</p>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/connections">Xem danh sách yêu cầu</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Đăng nhập</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-4 text-sm text-[var(--muted-foreground)] md:p-6">
      Đang xử lý yêu cầu từ email...
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg p-4 text-sm text-[var(--muted-foreground)]">
          Đang tải...
        </div>
      }
    >
      <FromEmailContent />
    </Suspense>
  );
}
