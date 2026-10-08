export default function CompanyHiddenNotice() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
        <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
          Công ty đang bị tạm ẩn bởi JoyWork
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Thành viên không vào được trang quản trị cho đến khi JoyWork khôi phục công ty.
        </p>
      </div>
    </div>
  );
}
