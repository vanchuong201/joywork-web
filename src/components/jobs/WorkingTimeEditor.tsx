"use client";

import { Clock, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  WORKING_DAYS,
  WORKING_DAY_INDEX,
  WORKING_DAY_OPTIONS,
  type WorkingDay,
  type WorkingTimeRange,
} from "@/lib/working-time";

const SELECT_CLASS =
  "h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm";

function createEmptyRange(): WorkingTimeRange {
  return { dayFrom: "MON", dayTo: "FRI", timeStart: "08:30", timeEnd: "17:00" };
}

type WorkingTimeEditorProps = {
  ranges: WorkingTimeRange[];
  onRangesChange: (next: WorkingTimeRange[]) => void;
  note: string;
  onNoteChange: (next: string) => void;
  maxRows?: number;
  rangeError?: string;
  noteError?: string;
};

export function WorkingTimeEditor({
  ranges,
  onRangesChange,
  note,
  onNoteChange,
  maxRows = 7,
  rangeError,
  noteError,
}: WorkingTimeEditorProps) {
  const updateRange = (index: number, patch: Partial<WorkingTimeRange>) => {
    const next = ranges.map((r, i) => {
      if (i !== index) return r;
      const merged: WorkingTimeRange = { ...r, ...patch };
      if (
        WORKING_DAY_INDEX[merged.dayFrom] >
        WORKING_DAY_INDEX[merged.dayTo]
      ) {
        merged.dayTo = merged.dayFrom;
      }
      return merged;
    });
    onRangesChange(next);
  };

  const handleAddRow = () => {
    if (ranges.length >= maxRows) return;
    onRangesChange([...ranges, createEmptyRange()]);
  };

  const handleRemoveRow = (index: number) => {
    onRangesChange(ranges.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {ranges.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--border)] bg-[var(--muted)]/30 px-4 py-6 text-center text-xs text-[var(--muted-foreground)]">
          Chưa có khung thời gian nào. Bấm &quot;Thêm thời gian&quot; để mô tả lịch làm việc.
        </div>
      ) : (
        <div className="space-y-2">
          {ranges.map((range, index) => {
            const dayToOptions = WORKING_DAY_OPTIONS.filter(
              (opt) => WORKING_DAY_INDEX[opt.value] >= WORKING_DAY_INDEX[range.dayFrom],
            );
            const timeError = range.timeStart && range.timeEnd && range.timeStart >= range.timeEnd;
            return (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] p-3 sm:flex-row sm:items-center"
              >
                <Clock className="hidden h-4 w-4 shrink-0 text-[var(--brand)] sm:block" />
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  <select
                    value={range.dayFrom}
                    onChange={(e) =>
                      updateRange(index, { dayFrom: e.target.value as WorkingDay })
                    }
                    className={cn(SELECT_CLASS, "w-[110px] flex-none")}
                    aria-label="Ngày bắt đầu"
                  >
                    {WORKING_DAY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-sm text-[var(--muted-foreground)]">—</span>
                  <select
                    value={range.dayTo}
                    onChange={(e) =>
                      updateRange(index, { dayTo: e.target.value as WorkingDay })
                    }
                    className={cn(SELECT_CLASS, "w-[110px] flex-none")}
                    aria-label="Ngày kết thúc"
                  >
                    {dayToOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="time"
                    value={range.timeStart}
                    onChange={(e) => updateRange(index, { timeStart: e.target.value })}
                    className={cn(
                      "w-[120px] flex-none",
                      timeError ? "border-red-500 focus-visible:ring-red-500" : "",
                    )}
                    aria-label="Giờ bắt đầu"
                  />
                  <Input
                    type="time"
                    value={range.timeEnd}
                    onChange={(e) => updateRange(index, { timeEnd: e.target.value })}
                    className={cn(
                      "w-[120px] flex-none",
                      timeError ? "border-red-500 focus-visible:ring-red-500" : "",
                    )}
                    aria-label="Giờ kết thúc"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                  aria-label="Xoá dòng thời gian"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-[var(--brand)] hover:text-[var(--brand)]"
        onClick={handleAddRow}
        disabled={ranges.length >= maxRows}
      >
        <Plus className="mr-1 h-4 w-4" />
        Thêm thời gian
      </Button>

      {rangeError ? <p className="text-xs text-red-500">{rangeError}</p> : null}

      <Textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Mô tả thêm về thời gian làm việc (ví dụ: linh hoạt, có thể làm tại bất cứ đâu, miễn đảm bảo hiệu quả...)"
        rows={2}
        maxLength={1000}
      />
      {noteError ? <p className="text-xs text-red-500">{noteError}</p> : null}
    </div>
  );
}

export const WORKING_TIME_DAYS = WORKING_DAYS;
