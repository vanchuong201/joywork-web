import { COMPANY_SIZE_OPTIONS, type CompanySizeOption } from "./provinces";

export { COMPANY_SIZE_OPTIONS, type CompanySizeOption };

const COMPANY_SIZE_OPTION_SET = new Set<string>(COMPANY_SIZE_OPTIONS);

/**
 * Maps the legacy CompanySize enum (still in production data for historical companies)
 * to the matching modern band so the UI can render older records consistently while
 * the backend migration drains them.
 */
const LEGACY_COMPANY_SIZE_MAP: Record<string, CompanySizeOption> = {
  STARTUP: "10-30",
  SMALL: "30-50",
  MEDIUM: "100-150",
  LARGE: "500-700",
  ENTERPRISE: "1000+",
};

/**
 * Normalize an arbitrary size string (legacy enum, spaced "0 - 10", trailing whitespace, …)
 * into the canonical band string. Returns null when the value is empty or unrecognized.
 */
export function normalizeCompanySize(input: string | null | undefined): CompanySizeOption | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const collapsed = trimmed.replace(/\s*-\s*/g, "-");
  if (COMPANY_SIZE_OPTION_SET.has(collapsed)) return collapsed as CompanySizeOption;
  const upper = collapsed.toUpperCase();
  if (LEGACY_COMPANY_SIZE_MAP[upper]) return LEGACY_COMPANY_SIZE_MAP[upper];
  return null;
}

/**
 * Human-readable label for a company size band. Returns the canonical band suffixed with
 * "nhân viên" for known values, the original string when it is non-empty but not in the
 * canonical list (so legacy/unknown values still render), and null otherwise.
 */
export function getCompanySizeLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = normalizeCompanySize(value);
  if (normalized) return `${normalized} nhân viên`;
  return value;
}

export function isCompanySizeBand(value: string | null | undefined): value is CompanySizeOption {
  return !!value && COMPANY_SIZE_OPTION_SET.has(value);
}
