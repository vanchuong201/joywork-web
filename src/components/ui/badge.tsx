import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import * as React from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
  {
    variants: {
      variant: {
        default: "bg-[var(--muted)] text-[var(--muted-foreground)]",
        secondary:
          "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
        outline:
          "border border-[var(--border)] bg-transparent text-[var(--foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
