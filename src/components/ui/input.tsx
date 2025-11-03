import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-[var(--muted-foreground)] transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };


