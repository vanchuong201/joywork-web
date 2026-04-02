"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, X, Search, Briefcase } from "lucide-react";
import { searchCompanyIndustries } from "@/lib/company-industries";
import { cn } from "@/lib/utils";

interface IndustrySelectProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export default function IndustrySelect({
  value,
  onChange,
  placeholder = "Chọn lĩnh vực hoạt động",
  className,
  disabled = false,
  id,
}: IndustrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = searchCompanyIndustries(query);

  const displayValue = value?.trim() ? value : "";

  const handleSelect = useCallback(
    (label: string) => {
      onChange?.(label);
      setQuery("");
      setOpen(false);
    },
    [onChange]
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
    setQuery("");
  };

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prev) => {
      if (!prev) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
      return !prev;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
    if (e.key === "Enter" && results.length > 0) {
      handleSelect(results[0]);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", open && "z-[200]", className)}>
      <button
        type="button"
        id={id}
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span
          className={cn(
            "flex items-start gap-2 pr-2",
            !displayValue && "text-muted-foreground"
          )}
        >
          {displayValue ? (
            <>
              <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="line-clamp-3 text-[var(--foreground)]">{displayValue}</span>
            </>
          ) : (
            placeholder
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {displayValue && !disabled && (
            <X
              className="h-3.5 w-3.5 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {open && (
        <div className="absolute z-[140] mt-1 w-full rounded-md border border-border bg-white shadow-xl ring-1 ring-black/10 dark:bg-[var(--card)] dark:ring-white/10">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm lĩnh vực..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {results.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Không tìm thấy lĩnh vực
              </li>
            ) : (
              results.map((label) => {
                const isSelected = label === value;
                return (
                  <li key={label}>
                    <button
                      type="button"
                      onClick={() => handleSelect(label)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent/50 font-medium"
                      )}
                    >
                      {label}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
