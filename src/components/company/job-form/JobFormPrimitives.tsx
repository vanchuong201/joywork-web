import { ChevronDown, ChevronRight } from "lucide-react";

type FormSectionProps = {
  title: string;
  description?: string;
  isExpanded: boolean;
  onToggle: () => void;
  required?: boolean;
  children: React.ReactNode;
};

type FormFieldProps = {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
};

export function FormSection({
  title,
  description,
  isExpanded,
  onToggle,
  required,
  children,
}: FormSectionProps) {
  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-[var(--muted)]/50 hover:bg-[var(--muted)] transition-colors text-left"
      >
        <div className="flex-1">
          <span className="font-semibold text-[var(--foreground)] block">
            {title}
            {required ? <span className="ml-1 text-red-500">*</span> : null}
          </span>
          {description ? (
            <p className="text-xs text-[var(--muted-foreground)] mt-1">{description}</p>
          ) : null}
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 shrink-0 ml-2" />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 ml-2" />
        )}
      </button>
      {isExpanded ? <div className="p-4 space-y-4">{children}</div> : null}
    </div>
  );
}

export function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-[var(--foreground)]">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
}
