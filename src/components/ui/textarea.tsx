import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-[var(--muted-foreground)] transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };


