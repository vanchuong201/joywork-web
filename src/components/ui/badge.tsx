import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[var(--muted)] px-2 py-0.5 text-xs text-[var(--muted-foreground)]",
        className
      )}
      {...props}
    />
  );
}


