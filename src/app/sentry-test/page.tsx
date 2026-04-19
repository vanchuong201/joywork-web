"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";

export default function SentryTestPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  const sendTestError = () => {
    setStatus("sending");
    Sentry.captureException(new Error("SENTRY_WEB_MANUAL_VERIFY_20260419"));
    setStatus("sent");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Sentry test page</h1>
      <p className="text-sm text-black/70">
        Dung trang nay de tao 1 issue test cho staging web.
      </p>
      <button
        type="button"
        onClick={sendTestError}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
      >
        Send test error
      </button>
      <p className="text-sm text-black/60">
        Status: {status === "idle" ? "ready" : status}
      </p>
    </main>
  );
}
