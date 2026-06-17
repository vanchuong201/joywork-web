"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";

export default function AuthPrompt() {
  const { isOpen, action, closePrompt } = useAuthPrompt();
  const pathname = usePathname();
  const redirectUrl = pathname || "/";

  if (!isOpen) return null;

  const actionText =
    {
      like: "thích bài viết",
      save: "lưu bài viết",
      "save-job": "lưu việc làm",
      apply: "ứng tuyển",
      follow: "theo dõi công ty",
      "follow-company": "theo dõi công ty",
      "message-company": "nhắn tin với doanh nghiệp",
      login: "tiếp tục",
    }[action || ""] || (action ? `truy cập ${action}` : "thực hiện hành động này");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={closePrompt} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg">
        <button
          onClick={closePrompt}
          className="absolute right-4 top-4 rounded-md p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-[var(--brand)]/10 flex items-center justify-center">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-semibold text-[var(--foreground)]">Đăng nhập để tiếp tục</h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Bạn cần đăng nhập để {actionText}.
          </p>
        </div>

        <div className="space-y-3">
          <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="block" onClick={closePrompt}>
            <Button className="w-full">
              Đăng nhập
            </Button>
          </Link>
          <Link href={`/register?redirect=${encodeURIComponent(redirectUrl)}`} className="block" onClick={closePrompt}>
            <Button variant="outline" className="w-full">
              Tạo tài khoản mới
            </Button>
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--muted-foreground)]">
          Bạn đã có tài khoản?{" "}
          <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="text-[var(--brand)] hover:underline" onClick={closePrompt}>
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

