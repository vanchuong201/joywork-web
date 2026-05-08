export const WORKING_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
export type WorkingDay = (typeof WORKING_DAYS)[number];

export const WORKING_DAY_INDEX: Record<WorkingDay, number> = {
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
  SUN: 7,
};

export const WORKING_DAY_LABELS: Record<WorkingDay, string> = {
  MON: "Thứ 2",
  TUE: "Thứ 3",
  WED: "Thứ 4",
  THU: "Thứ 5",
  FRI: "Thứ 6",
  SAT: "Thứ 7",
  SUN: "Chủ nhật",
};

export const WORKING_DAY_OPTIONS = WORKING_DAYS.map((value) => ({
  value,
  label: WORKING_DAY_LABELS[value],
}));

export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface WorkingTimeRange {
  dayFrom: WorkingDay;
  dayTo: WorkingDay;
  timeStart: string;
  timeEnd: string;
}

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function isWorkingDay(value: unknown): value is WorkingDay {
  return typeof value === "string" && (WORKING_DAYS as readonly string[]).includes(value);
}

export function isValidWorkingTimeRange(value: unknown): value is WorkingTimeRange {
  if (!value || typeof value !== "object") return false;
  const range = value as Record<string, unknown>;
  if (!isWorkingDay(range.dayFrom) || !isWorkingDay(range.dayTo)) return false;
  if (typeof range.timeStart !== "string" || typeof range.timeEnd !== "string") return false;
  if (!isValidTime(range.timeStart) || !isValidTime(range.timeEnd)) return false;
  if (WORKING_DAY_INDEX[range.dayFrom] > WORKING_DAY_INDEX[range.dayTo]) return false;
  if (range.timeStart >= range.timeEnd) return false;
  return true;
}

export function parseWorkingTimeRanges(input: unknown): WorkingTimeRange[] {
  if (!Array.isArray(input)) return [];
  return input.filter(isValidWorkingTimeRange);
}

export function formatWorkingDayRange(range: WorkingTimeRange): string {
  if (range.dayFrom === range.dayTo) {
    return WORKING_DAY_LABELS[range.dayFrom];
  }
  return `${WORKING_DAY_LABELS[range.dayFrom]} - ${WORKING_DAY_LABELS[range.dayTo]}`;
}

export function formatWorkingTimeRange(range: WorkingTimeRange): string {
  return `${formatWorkingDayRange(range)}: ${range.timeStart} - ${range.timeEnd}`;
}
