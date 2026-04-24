"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, X, Search, MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWardsByProvinceCodes, type WardOption } from "@/lib/location-wards";
import { getProvinceNameByCode } from "@/lib/provinces";

interface WardSelectProps {
  provinceCodes: string[];
  /** Single-select value */
  value?: string | null;
  /** Multi-select values */
  values?: string[];
  /** Single-select callback */
  onChange?: (value: string | null) => void;
  /** Multi-select callback */
  onChangeValues?: (values: string[]) => void;
  /** Enable multi-select mode (default: false for single-select) */
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function wardLabel(w: WardOption): string {
  const prov = getProvinceNameByCode(w.provinceCode) || w.provinceCode;
  return `${w.fullName ?? w.name} — ${prov}`;
}

export default function WardSelect({
  provinceCodes,
  value,
  values = [],
  onChange,
  onChangeValues,
  multiple = false,
  placeholder = "Chọn phường / xã (tùy chọn)",
  className,
  disabled = false,
}: WardSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [wards, setWards] = useState<WardOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [wardName, setWardName] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const key = useMemo(() => [...provinceCodes].sort().join(","), [provinceCodes]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!provinceCodes.length) {
        setWards([]);
        return;
      }
      setLoading(true);
      try {
        const list = await fetchWardsByProvinceCodes(provinceCodes);
        if (!cancelled) {
          setWards(list);
          setLoading(false);
          // Update wardName for current value
          if (value) {
            const matched = list.find((w) => w.code === value);
            if (matched) setWardName(matched.fullName ?? matched.name);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setWards([]);
        }
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  const byCode = useMemo(() => new Map(wards.map((w) => [w.code, w])), [wards]);

  const filtered = useMemo(() => {
    if (!query.trim()) return wards;
    const q = query.toLowerCase().trim();
    return wards.filter((w) => {
      const a = (w.fullName ?? w.name).toLowerCase();
      const b = w.name.toLowerCase();
      const c = w.code.toLowerCase();
      return a.includes(q) || b.includes(q) || c.includes(q);
    });
  }, [wards, query]);

  // Single-select display - use wardName if wards not loaded yet, otherwise lookup
  const displaySingle = value ? wardName ?? byCode.get(value)?.fullName ?? byCode.get(value)?.name ?? value : "";

  // Multi-select display
  const displayMulti =
    values.length > 0
      ? values
          .slice(0, 2)
          .map((v) => byCode.get(v)?.fullName ?? byCode.get(v)?.name ?? v)
          .join(", ") + (values.length > 2 ? ` +${values.length - 2}` : "")
      : "";

  const handleSelect = useCallback(
    (ward: WardOption) => {
      if (multiple) {
        const next = values.includes(ward.code)
          ? values.filter((item) => item !== ward.code)
          : [...values, ward.code];
        onChangeValues?.(next);
      } else {
        // Single-select: replace value, close dropdown
        onChange?.(ward.code);
        setOpen(false);
        setQuery("");
      }
    },
    [values, multiple, onChange, onChangeValues]
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
    if (disabled || !provinceCodes.length) return;
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

  const blocked = disabled || !provinceCodes.length;
  const hasValue = multiple ? values.length > 0 : !!value;

  return (
    <div ref={containerRef} className={cn("relative", open && "z-[200]", className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={blocked}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          open && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span
          className={cn(
            "flex items-center gap-2 truncate",
            !hasValue && "text-muted-foreground"
          )}
        >
          {hasValue ? (
            <>
              <MapPinned className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {multiple ? displayMulti : displaySingle}
            </>
          ) : !provinceCodes.length ? (
            "Chọn tỉnh / thành trước"
          ) : (
            placeholder
          )}
        </span>
        <span className="flex items-center gap-1 shrink-0 ml-2">
          {hasValue && !blocked && (
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

      {open && !blocked && (
        <div className="absolute z-[140] mt-1 w-full rounded-md border border-border bg-white shadow-xl ring-1 ring-black/10 dark:bg-slate-900 dark:ring-white/10">
          <div className="flex items-center border-b border-border bg-white px-3 py-2 gap-2 dark:bg-slate-900">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm phường / xã..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <ul className="max-h-56 overflow-y-auto bg-white py-1 dark:bg-slate-900">
            {loading ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">Đang tải...</li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                {wards.length === 0 ? "Chưa có danh sách phường/xã" : "Không tìm thấy"}
              </li>
            ) : (
              filtered.map((ward) => {
                const isSelected = multiple ? values.includes(ward.code) : value === ward.code;
                return (
                  <li key={ward.code}>
                    <button
                      type="button"
                      onClick={() => handleSelect(ward)}
                      className={cn(
                        "flex w-full flex-col bg-white px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors dark:bg-slate-900",
                        isSelected && "bg-accent/50 font-medium"
                      )}
                    >
                      <span>{ward.fullName ?? ward.name}</span>
                      <span className="text-xs text-muted-foreground">{wardLabel(ward)}</span>
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
