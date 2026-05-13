"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProvinceSelect from "@/components/ui/province-select";
import WardSelect from "@/components/ui/ward-select";
import MultiSelect from "@/components/ui/multi-select";
import { Search, X } from "lucide-react";
import { EDUCATION_LEVEL_OPTIONS } from "@/lib/education-levels";

const GENDER_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
];

function generateYearOptions() {
  const currentYear = new Date().getFullYear();
  const minAge = 18;
  const maxAge = 65;
  const years: { value: string; label: string }[] = [];
  for (let y = currentYear - minAge; y >= currentYear - maxAge; y--) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

const YEAR_OPTIONS = generateYearOptions();

/** Input that debounces onChange to avoid excessive updates while typing. */
function DebouncedInput({
  value,
  onChange,
  onDebounce,
  debounceMs = 400,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  onDebounce?: (value: string) => void;
  debounceMs?: number;
}) {
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(localValue);
      onDebounce?.(localValue);
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localValue, debounceMs]);

  return (
    <input
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  );
}

export type CandidateFilterValues = {
  keyword: string;
  locations: string[];
  wardCodes: string[];
  salaryCurrency: "VND" | "USD";
  salaryMin: string;
  salaryMax: string;
  gender: string;
  yearOfBirthMin: string;
  yearOfBirthMax: string;
  educationLevels: string[];
  page: number;
};

function parseSalaryCurrency(value?: string | null): "VND" | "USD" {
  if (value === "VND" || value === "USD") return value;
  return "VND";
}

export function CandidateFilterControls({
  values,
  onValuesChange,
  showSalaryFilters = false,
  compact = false,
  onSearch,
  onClear,
}: {
  values: CandidateFilterValues;
  onValuesChange: (v: CandidateFilterValues) => void;
  showSalaryFilters?: boolean;
  compact?: boolean;
  onSearch?: (keyword?: string) => void;
  onClear?: () => void;
}) {
  const set = (patch: Partial<CandidateFilterValues>) =>
    onValuesChange({ ...values, ...patch, page: 1 });

  const inputClass = compact
    ? "h-9 text-xs rounded-md border border-[var(--border)] bg-background px-2 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-1"
    : "h-10 rounded-md border border-[var(--border)] bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2";
  const selectClass = compact
    ? "h-9 rounded-md border border-[var(--border)] bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-1"
    : "h-10 rounded-md border border-[var(--border)] bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2";

  return (
    <div className="space-y-3">
      {/* Row 1: keyword + locations + wards */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {showSalaryFilters ? (
          <DebouncedInput
            className={inputClass}
            value={values.keyword}
            onChange={() => {}}
            onDebounce={(kw) => set({ keyword: kw })}
            placeholder="Từ khóa trong CV (ưu tiên vị trí ứng tuyển)"
          />
        ) : (
          <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <DebouncedInput
              className={`${inputClass} pl-9`}
              value={values.keyword}
              onChange={() => {}}
              onDebounce={(kw) => set({ keyword: kw })}
              onKeyDown={(e) => e.key === "Enter" && onSearch?.()}
              placeholder="Từ khóa trong CV (ưu tiên vị trí ứng tuyển)"
            />
          </div>
        )}
        <ProvinceSelect
          multiple
          values={values.locations}
          onChangeValues={(vl) => set({ locations: vl, wardCodes: values.wardCodes.filter((c) => vl.some((p) => c.startsWith(`${p}/`))) })}
          placeholder="Chọn tỉnh / thành phố"
        />
        <WardSelect
          provinceCodes={values.locations}
          values={values.wardCodes}
          onChangeValues={(vc) => set({ wardCodes: vc })}
          placeholder="Chọn phường / xã"
        />
      </div>

      {/* Row 2: salary filters */}
      {showSalaryFilters && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            className={inputClass}
            value={values.salaryMin}
            onChange={(e) => set({ salaryMin: e.target.value })}
            placeholder={`Lương tối thiểu (${values.salaryCurrency})`}
            type="number"
          />
          <Input
            className={inputClass}
            value={values.salaryMax}
            onChange={(e) => set({ salaryMax: e.target.value })}
            placeholder={`Lương tối đa (${values.salaryCurrency})`}
            type="number"
          />
          <select
            className={`${selectClass} ${inputClass} w-[90px] shrink-0`}
            value={values.salaryCurrency}
            onChange={(e) => set({ salaryCurrency: e.target.value as "VND" | "USD" })}
          >
            <option value="VND">VND</option>
            <option value="USD">USD</option>
          </select>
        </div>
      )}

      {/* Row 3: gender, year of birth, education */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {/* Gender */}
        <div className="flex items-center gap-1">
          <span className="whitespace-nowrap text-xs text-[var(--muted-foreground)]">Giới tính:</span>
          <select
            className={selectClass}
            value={values.gender}
            onChange={(e) => set({ gender: e.target.value })}
          >
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Year of birth */}
        <div className="flex items-center gap-1">
          <span className="whitespace-nowrap text-xs text-[var(--muted-foreground)]">Năm sinh:</span>
          <select
            className={`${selectClass} ${inputClass} w-[90px]`}
            value={values.yearOfBirthMin}
            onChange={(e) => set({ yearOfBirthMin: e.target.value })}
          >
            <option value="">Từ</option>
            {YEAR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <span className="text-[var(--muted-foreground)]">—</span>
          <select
            className={`${selectClass} ${inputClass} w-[90px]`}
            value={values.yearOfBirthMax}
            onChange={(e) => set({ yearOfBirthMax: e.target.value })}
          >
            <option value="">Đến</option>
            {YEAR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Education level */}
        <div className="flex items-center gap-1">
          <span className="whitespace-nowrap text-xs text-[var(--muted-foreground)]">Trình độ:</span>
          <MultiSelect
            options={EDUCATION_LEVEL_OPTIONS}
            values={values.educationLevels}
            onChangeValues={(vl) => set({ educationLevels: vl })}
            placeholder="Chọn trình độ"
            className="w-44"
            compact={compact}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {showSalaryFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
            >
              Xóa lọc
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={() => onSearch?.()}>
                <Search className="mr-1 h-3 w-3" />Tìm
              </Button>
              <Button variant="outline" size="sm" onClick={onClear}>
                <X className="mr-1 h-3 w-3" />Xóa
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook: manage candidate filter state, synced with URL search params.
 */
export function useCandidateFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const values: CandidateFilterValues = {
    keyword: sp.get("keyword") || "",
    locations: sp.getAll("location"),
    wardCodes: sp.getAll("ward"),
    salaryCurrency: parseSalaryCurrency(sp.get("salaryCurrency")),
    salaryMin: sp.get("salaryMin") || "",
    salaryMax: sp.get("salaryMax") || "",
    gender: sp.get("gender") || "",
    yearOfBirthMin: sp.get("yearOfBirthMin") || "",
    yearOfBirthMax: sp.get("yearOfBirthMax") || "",
    educationLevels: sp.get("educationLevels") ? sp.get("educationLevels")!.split(",") : [],
    page: Number(sp.get("page")) || 1,
  };

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const setValues = useCallback(
    (next: CandidateFilterValues | ((prev: CandidateFilterValues) => CandidateFilterValues)) => {
      const nextVals = typeof next === "function" ? next(valuesRef.current) : next;
      const params = new URLSearchParams(sp.toString());
      const filterParamKeys = [
        "keyword",
        "location",
        "ward",
        "salaryCurrency",
        "salaryMin",
        "salaryMax",
        "gender",
        "yearOfBirthMin",
        "yearOfBirthMax",
        "educationLevels",
        "page",
      ] as const;
      filterParamKeys.forEach((key) => params.delete(key));

      if (nextVals.keyword) params.set("keyword", nextVals.keyword);
      nextVals.locations.forEach((l) => params.append("location", l));
      nextVals.wardCodes.forEach((w) => params.append("ward", w));
      if (nextVals.salaryCurrency !== "VND") params.set("salaryCurrency", nextVals.salaryCurrency);
      if (nextVals.salaryMin) params.set("salaryMin", nextVals.salaryMin);
      if (nextVals.salaryMax) params.set("salaryMax", nextVals.salaryMax);
      if (nextVals.gender) params.set("gender", nextVals.gender);
      if (nextVals.yearOfBirthMin) params.set("yearOfBirthMin", nextVals.yearOfBirthMin);
      if (nextVals.yearOfBirthMax) params.set("yearOfBirthMax", nextVals.yearOfBirthMax);
      if (nextVals.educationLevels.length > 0) params.set("educationLevels", nextVals.educationLevels.join(","));
      if (nextVals.page > 1) params.set("page", String(nextVals.page));

      const qs = params.toString();
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
    },
    [router, sp],
  );

  const clearFilters = useCallback(() => {
    setValues({
      keyword: "",
      locations: [],
      wardCodes: [],
      salaryCurrency: "VND",
      salaryMin: "",
      salaryMax: "",
      gender: "",
      yearOfBirthMin: "",
      yearOfBirthMax: "",
      educationLevels: [],
      page: 1,
    });
  }, [setValues]);

  return { values, setValues, clearFilters };
}
