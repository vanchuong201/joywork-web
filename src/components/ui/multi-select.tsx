"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: SelectOption[];
  values: string[];
  onChangeValues: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  searchable?: boolean;
  disabled?: boolean;
}

export default function MultiSelect({
  options,
  values,
  onChangeValues,
  placeholder = "Chọn...",
  className,
  compact = false,
  searchable = false,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.toLowerCase().trim();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const displayLabels = useMemo(() => {
    if (values.length === 0) return "";
    const first = byValue.get(values[0]);
    const count = values.length;
    return `${first?.label ?? values[0]}${count > 1 ? ` +${count - 1}` : ""}`;
  }, [values, byValue]);

  const handleSelect = useCallback(
    (value: string) => {
      const next = values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value];
      onChangeValues(next);
    },
    [values, onChangeValues]
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeValues([]);
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

  const triggerH = compact ? "h-9 text-xs" : "h-10 text-sm";

  return (
    <div ref={containerRef} className={cn("relative", open && "z-[200]", className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 ring-offset-background transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          triggerH,
          open && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn("flex items-center gap-2 truncate", !displayLabels && "text-muted-foreground")}>
          {displayLabels || placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0 ml-2">
          {values.length > 0 && !disabled && (
            <X
              className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </span>
      </button>

      {open && !disabled && (
        <div className="absolute z-[140] mt-1 w-full rounded-md border border-border bg-white shadow-xl ring-1 ring-black/10 dark:bg-slate-900 dark:ring-white/10">
          {searchable && (
            <div className="flex items-center border-b border-border bg-white px-3 py-2 gap-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm..."
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
          )}
          <ul className="max-h-56 overflow-y-auto bg-white py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Không tìm thấy
              </li>
            ) : (
              filtered.map((opt) => {
                const isSelected = values.includes(opt.value);
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "flex w-full items-center gap-2 bg-white px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                        isSelected && "bg-accent/50 font-medium"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded border",
                          isSelected
                            ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                            : "border-[var(--border)]"
                        )}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className="text-foreground">{opt.label}</span>
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
