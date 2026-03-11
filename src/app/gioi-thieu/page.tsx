"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 md:p-8">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Về ứng dụng
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/gioi-thieu"
              className="font-medium text-[var(--foreground)]"
            >
              Giới thiệu
            </Link>
            <span className="text-[var(--muted-foreground)]">•</span>
            <Link
              href="/dieu-khoan-hoat-dong"
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline"
            >
              Điều khoản hoạt động
            </Link>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)] md:text-3xl">Giới thiệu JOYWORK</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
          JOYWORK là nền tảng giúp các doanh nghiệp có môi trường làm việc tốt lên tiếng để kể câu chuyện thật về văn hóa
          doanh nghiệp, từ đó thu hút những nhân sự phù hợp về cả văn hóa và kỹ năng.
        </p>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
          Chúng tôi tập trung xây dựng trải nghiệm minh bạch giữa doanh nghiệp và ứng viên thông qua hồ sơ doanh nghiệp,
          tuyển dụng, trao đổi trực tiếp và các công cụ hỗ trợ ra quyết định.
        </p>
      </div>
    </main>
  );
}

