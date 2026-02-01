import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "";
  try {
    return format(new Date(date), "dd/MM/yyyy", { locale: vi });
  } catch (error) {
    return "";
  }
}

/** Format date-only (e.g. applicationDeadline) theo ngày UTC để đồng bộ với ngày tạo, tránh lệch múi giờ (15/1 không thành 16/1). */
export function formatDateUTC(date: string | Date | undefined | null): string {
  if (!date) return "";
  try {
    const d = new Date(date);
    const day = d.getUTCDate();
    const month = d.getUTCMonth() + 1;
    const year = d.getUTCFullYear();
    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
  } catch (error) {
    return "";
  }
}
