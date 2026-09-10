"use client";

import { useEffect } from "react";

/** Đóng overlay/modal khi nhấn Escape (dùng khi tắt dismiss-by-outside của HeadlessUI). */
export function useEscapeClose(enabled: boolean, onClose: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, onClose]);
}
