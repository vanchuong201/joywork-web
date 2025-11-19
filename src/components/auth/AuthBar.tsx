"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AuthBar() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const redirectUrl = pathname || "/";

  // Lưu trạng thái vào localStorage để không hiển thị lại sau khi đóng
  useEffect(() => {
    const dismissed = localStorage.getItem("authBarDismissed");
    if (dismissed === "true") {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("authBarDismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--card)] shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Đăng nhập để lưu việc làm, theo dõi công ty và nhiều hơn nữa
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              Tạo tài khoản miễn phí và khám phá cơ hội việc làm tốt nhất
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}>
              <Button variant="outline" size="sm">
                Đăng nhập
              </Button>
            </Link>
            <Link href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}>
              <Button size="sm">Đăng ký</Button>
            </Link>
            <button
              onClick={handleDismiss}
              className="rounded-md p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

