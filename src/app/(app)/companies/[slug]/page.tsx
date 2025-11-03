export default function CompanyProfilePage({ params }: { params: { slug: string } }) {
  // Skeleton (wireframe) per giao_dien_idea.md
  return (
    <div className="mx-auto max-w-[980px] space-y-6 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-[var(--muted)]" />
          <div>
            <div className="text-lg font-semibold">Company: {params.slug}</div>
            <div className="text-sm text-[var(--muted-foreground)]">Slogan ngắn</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm">❤️ Follow</button>
          <button className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm">💬 Message</button>
          <a href="/jobs" className="rounded-md border border-[var(--border)] px-3 py-1.5 text-sm">💼 View Jobs</a>
        </div>
      </header>
      <div className="aspect-video w-full rounded-md bg-[var(--muted)]" />
      <section className="space-y-6">
        <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-2 text-base font-semibold">1️⃣ Câu chuyện tổ chức (Why – What – How)</h2>
          <p className="text-sm text-[var(--muted-foreground)]">“Vì sao chúng tôi ra đời… cách chúng tôi làm khác biệt…”</p>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-2 text-base font-semibold">2️⃣ Văn hoá & Giá trị cốt lõi</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            <li className="rounded-md border border-[var(--border)] p-3">Chính trực – Nói thật, làm thật</li>
            <li className="rounded-md border border-[var(--border)] p-3">Học hỏi – Không ngừng cải thiện</li>
            <li className="rounded-md border border-[var(--border)] p-3">Đồng hành – Thành công cùng nhau</li>
          </ul>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-2 text-base font-semibold">3️⃣ Cách làm việc (Ways of Working)</h2>
          <ul className="list-disc pl-5 text-sm text-[var(--muted-foreground)]">
            <li>Báo cáo ngắn, hành động nhanh.</li>
            <li>Không họp nếu không có mục tiêu rõ ràng.</li>
            <li>Ai cũng có quyền phản biện.</li>
          </ul>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-2 text-base font-semibold">4️⃣ Inside Joy – Hình ảnh & Video</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="h-24 rounded-md bg-[var(--muted)]" />
            <div className="h-24 rounded-md bg-[var(--muted)]" />
            <div className="h-24 rounded-md bg-[var(--muted)]" />
          </div>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-2 text-base font-semibold">5️⃣ Lãnh đạo & Tinh thần dẫn dắt</h2>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[var(--muted)]" />
            <div className="text-sm text-[var(--muted-foreground)]">“Tôi không muốn nhân viên giỏi, tôi muốn đội giỏi.”</div>
          </div>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-2 text-base font-semibold">6️⃣ Chứng cứ & Cam kết</h2>
          <div className="grid grid-cols-4 gap-2">
            <div className="h-16 rounded-md bg-[var(--muted)]" />
            <div className="h-16 rounded-md bg-[var(--muted)]" />
            <div className="h-16 rounded-md bg-[var(--muted)]" />
            <div className="h-16 rounded-md bg-[var(--muted)]" />
          </div>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-2 text-base font-semibold">7️⃣ Bài viết gần đây</h2>
          <ul className="list-disc pl-5 text-sm text-[var(--muted-foreground)]">
            <li>Post gần đây #1</li>
            <li>Post gần đây #2</li>
          </ul>
        </div>
        <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4">
          <h2 className="mb-2 text-base font-semibold">8️⃣ Thông tin liên hệ & Theo dõi</h2>
          <div className="text-sm text-[var(--muted-foreground)]">website.com · contact@company.com · Hà Nội</div>
        </div>
      </section>
    </div>
  );
}


