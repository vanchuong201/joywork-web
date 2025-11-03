export default function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
      <div className="mx-auto mb-3 h-10 w-10 rounded-md bg-[var(--muted)]" />
      <div className="text-sm font-medium">{title}</div>
      {subtitle && <div className="mt-1 text-sm text-[var(--muted-foreground)]">{subtitle}</div>}
    </div>
  );
}


