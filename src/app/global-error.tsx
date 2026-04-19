"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-semibold">Đã xảy ra lỗi ngoài dự kiến</h1>
          <p className="text-sm text-black/70">
            Hệ thống đã ghi nhận lỗi này. Bạn có thể thử tải lại màn hình.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Thử lại
          </button>
        </main>
      </body>
    </html>
  );
}
