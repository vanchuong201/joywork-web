/**
 * Thin GA4 wrapper. No-ops on the server or when gtag has not loaded
 * (e.g. ad-blocked, GA disabled) so callers never need to guard.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }
  try {
    window.gtag("event", eventName, params);
  } catch {
    // analytics must never break the app
  }
}
