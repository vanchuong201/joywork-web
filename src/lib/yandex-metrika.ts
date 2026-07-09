/**
 * Thin Yandex Metrika wrapper. Counter ID comes from the same env var
 * that gates the Metrika script (prod-only), so this no-ops on the
 * server, on dev/staging, or when the script is blocked/not loaded.
 */
const COUNTER_ID_PATTERN = /^\d+$/;

function getCounterId(): number | null {
  const raw = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID?.trim();
  return raw && COUNTER_ID_PATTERN.test(raw) ? Number(raw) : null;
}

export function trackYmGoal(
  goal: string,
  params?: Record<string, unknown>,
): void {
  const counterId = getCounterId();
  if (
    counterId === null ||
    typeof window === "undefined" ||
    typeof window.ym !== "function"
  ) {
    return;
  }
  try {
    window.ym(counterId, "reachGoal", goal, params);
  } catch {
    // analytics must never break the app
  }
}
