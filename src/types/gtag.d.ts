export {};

declare global {
  interface Window {
    gtag?: (
      command: "event" | "config" | "js" | "set",
      targetOrEventName: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}
