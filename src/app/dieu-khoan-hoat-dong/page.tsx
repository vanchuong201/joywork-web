import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { marked } from "marked";

export default async function TermsPage() {
  const policyPath = path.join(process.cwd(), "public", "policy.md");
  const policyContent = await fs.readFile(policyPath, "utf-8");

  // Extract header metadata (Phiên bản, Ngày hiệu lực, Đơn vị chủ quản)
  const headerLines: string[] = [];
  const lines = policyContent.split("\n");
  let contentStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.startsWith("#") && !line.startsWith("##")) {
      headerLines.push(line);
      contentStartIndex = i + 1;
    } else if (line.startsWith("## LỜI MỞ ĐẦU")) {
      contentStartIndex = i;
      break;
    }
  }

  const mainContent = lines.slice(contentStartIndex).join("\n").trim();
  const policyHtml = await marked.parse(mainContent);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm md:p-8">
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
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:underline"
            >
              Giới thiệu
            </Link>
            <span className="text-[var(--muted-foreground)]">•</span>
            <Link
              href="/dieu-khoan-hoat-dong"
              className="font-medium text-[var(--foreground)]"
            >
              Điều khoản hoạt động
            </Link>
          </div>
        </div>
        <div className="border-b border-[var(--border)] pb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand)]">JOYWORK</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)] md:text-3xl">Điều khoản hoạt động</h1>
          <div className="mt-3 space-y-0.5 text-[17px] leading-8 text-slate-700">
            {headerLines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>

        <article
          className="mt-6 text-base leading-8 text-slate-700
            [&>p]:my-3 [&>p]:text-[17px] [&>p]:leading-8
            [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:uppercase [&>h2]:text-slate-900 [&>h2]:tracking-wide
            [&>h3]:mt-8 [&>h3]:mb-3 [&>h3]:text-[19px] [&>h3]:font-bold [&>h3]:text-slate-900
            [&>ul]:my-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:my-1.5 [&>ul>li]:text-[17px]
            [&>blockquote]:my-6 [&>blockquote]:rounded-r-lg [&>blockquote]:border-l-4 [&>blockquote]:border-[var(--brand)] [&>blockquote]:bg-[var(--muted)]/50 [&>blockquote]:px-4 [&>blockquote]:py-3 [&>blockquote>p]:my-1 [&>blockquote>p]:text-[17px] [&>blockquote>p]:leading-8
            [&_strong]:font-bold [&_strong]:text-slate-900
            [&_hr]:my-8 [&_hr]:border-[var(--border)]"
          dangerouslySetInnerHTML={{ __html: policyHtml }}
        />

        <div className="mt-8 border-t border-[var(--border)] pt-4">
          <p className="text-xs text-[var(--muted-foreground)]">
            Cập nhật tự động từ tài liệu chính sách nội bộ tại `public/policy.md`.
          </p>
        </div>
      </div>
    </main>
  );
}

