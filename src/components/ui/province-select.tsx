"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, X, Search, MapPin } from "lucide-react";
import {
  searchProvinces,
  getProvinceNameByCode,
  type Province,
} from "@/lib/provinces";
import { cn } from "@/lib/utils";

interface ProvinceSelectProps {
  value?: string | null;
  values?: string[];
  onChange?: (value: string | null) => void;
  onChangeValues?: (values: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function ProvinceSelect({
  value,
  values = [],
  onChange,
  onChangeValues,
  multiple = false,
  placeholder = "Chọn tỉnh / thành phố",
  className,
  disabled = false,
}: ProvinceSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = searchProvinces(query);

  const displayValue = value ? getProvinceNameByCode(value) || value : "";
  const displayValues = values.map((code) => getProvinceNameByCode(code) || code);

  const handleSelect = useCallback(
    (province: Province) => {
      if (multiple) {
        const next = values.includes(province.code)
          ? values.filter((item) => item !== province.code)
          : [...values, province.code];
        onChangeValues?.(next);
      } else {
        onChange?.(province.code);
      }
      setQuery("");
      if (!multiple) {
        setOpen(false);
      }
    },
    [multiple, values, onChange, onChangeValues]
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) {
      onChangeValues?.([]);
    } else {
      onChange?.(null);
    }
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

  // Close on outside click
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
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn("flex items-center gap-2 truncate", !displayValue && !multiple && "text-muted-foreground")}>
          {multiple ? (
            displayValues.length > 0 ? (
              <>
                <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                {displayValues.slice(0, 2).join(", ")}
                {displayValues.length > 2 ? ` +${displayValues.length - 2}` : ""}
              </>
            ) : (
              placeholder
            )
          ) : displayValue ? (
            <>
              <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {displayValue}
            </>
          ) : (
            placeholder
          )}
        </span>
        <span className="flex items-center gap-1 shrink-0 ml-2">
          {((multiple && values.length > 0) || (!multiple && displayValue)) && !disabled && (
            <X
              className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[140] mt-1 w-full rounded-md border border-border bg-white shadow-xl ring-1 ring-black/10 dark:ring-white/10">
          {/* Search input */}
          <div className="flex items-center border-b border-border bg-white px-3 py-2 gap-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tìm tỉnh / thành phố..."
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

          {/* Options list */}
          <ul className="max-h-56 overflow-y-auto bg-white py-1">
            {results.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                Không tìm thấy tỉnh / thành phố
              </li>
            ) : (
              results.map((province) => {
                const isSelected = multiple
                  ? values.includes(province.code)
                  : province.code === value;
                const showMergedFrom =
                  query &&
                  province.merged &&
                  province.merged_from.some((f) =>
                    f.toLowerCase().includes(query.toLowerCase())
                  );

                return (
                  <li key={province.code}>
                    <button
                      type="button"
                      onClick={() => handleSelect(province)}
                      className={cn(
                        "flex w-full flex-col bg-white px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                        isSelected && "bg-accent/50 font-medium"
                      )}
                    >
                      <span>{province.name}</span>
                      <span className="text-xs text-muted-foreground">{province.code}</span>
                      {showMergedFrom && (
                        <span className="text-xs text-muted-foreground mt-0.5">
                          (gộp từ: {province.merged_from.join(", ")})
                        </span>
                      )}
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
