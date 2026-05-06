"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface DateOfBirthPickerProps {
  day: number | null | undefined;
  month: number | null | undefined;
  year: number | null | undefined;
  onChangeDay: (day: number | null) => void;
  onChangeMonth: (month: number | null) => void;
  onChangeYear: (year: number | null) => void;
  /** Nếu true, trình duyệt nhắc chọn năm trước khi gửi form (kết hợp validation Zod). */
  yearRequired?: boolean;
  className?: string;
}

// Generate year options (from oldest reasonable to youngest allowed)
const generateYears = () => {
  const currentYear = new Date().getFullYear() - 16;
  const startYear = 1950;
  const years: { value: number; label: string }[] = [];
  for (let y = currentYear; y >= startYear; y--) {
    years.push({ value: y, label: String(y) });
  }
  return years;
};

const YEARS = generateYears();

export default function DateOfBirthPicker({
  day,
  month,
  year,
  onChangeDay,
  onChangeMonth,
  onChangeYear,
  yearRequired = false,
  className,
}: DateOfBirthPickerProps) {
  // Get max days for given month/year
  const getMaxDaysFor = useCallback((m: number | null, y: number | null) => {
    if (!m || !y) return 31;
    return new Date(y, m, 0).getDate();
  }, []);

  const handleYearChange = (value: string) => {
    if (!value) {
      onChangeYear(null);
      return;
    }
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    onChangeYear(num);

    // Auto-fix day if exceeds max days for this year
    if (day && month) {
      const maxDays = getMaxDaysFor(month, num);
      if (day > maxDays) {
        onChangeDay(maxDays);
      }
    }
  };

  const handleMonthChange = (value: string) => {
    if (!value) {
      onChangeMonth(null);
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 12) return;

    onChangeMonth(num);

    // Auto-fix day if exceeds max days for this month/year
    if (day && year) {
      const maxDays = getMaxDaysFor(num, year);
      if (day > maxDays) {
        onChangeDay(maxDays);
      }
    }
  };

  const handleDayChange = (value: string) => {
    if (!value) {
      onChangeDay(null);
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 1 || num > 31) return;

    // Validate against max days for current month/year
    if (month && year) {
      const maxDays = getMaxDaysFor(month, year);
      if (num > maxDays) {
        onChangeDay(maxDays);
        return;
      }
    }

    onChangeDay(num);
  };

  // Get max days for current selection
  const currentMaxDays = getMaxDaysFor(month ?? null, year ?? null);

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Day select */}
      <select
        value={day ?? ""}
        onChange={(e) => handleDayChange(e.target.value)}
        className="flex h-10 flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Ngày</option>
        {Array.from({ length: currentMaxDays }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      {/* Month select */}
      <select
        value={month ?? ""}
        onChange={(e) => handleMonthChange(e.target.value)}
        className="flex h-10 flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Tháng</option>
        {[
          { value: 1, label: "Tháng 1" },
          { value: 2, label: "Tháng 2" },
          { value: 3, label: "Tháng 3" },
          { value: 4, label: "Tháng 4" },
          { value: 5, label: "Tháng 5" },
          { value: 6, label: "Tháng 6" },
          { value: 7, label: "Tháng 7" },
          { value: 8, label: "Tháng 8" },
          { value: 9, label: "Tháng 9" },
          { value: 10, label: "Tháng 10" },
          { value: 11, label: "Tháng 11" },
          { value: 12, label: "Tháng 12" },
        ].map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      {/* Year select */}
      <select
        value={year ?? ""}
        onChange={(e) => handleYearChange(e.target.value)}
        required={yearRequired}
        aria-required={yearRequired || undefined}
        className="flex h-10 flex-1 min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Năm</option>
        {YEARS.map((y) => (
          <option key={y.value} value={y.value}>
            {y.label}
          </option>
        ))}
      </select>
    </div>
  );
}
