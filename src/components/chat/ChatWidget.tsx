"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { JobSearchChat } from "./JobSearchChat";

export function ChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <div
        className={`w-[360px] h-[520px] rounded-2xl border border-[var(--border)] bg-[var(--background)] shadow-2xl flex-col overflow-hidden ${open ? "flex" : "hidden"
          }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--primary)]">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-[var(--primary-foreground)]" />
            <span className="text-sm font-semibold text-[var(--primary-foreground)]">
              Tìm việc với JOYWORK AI
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-[var(--primary-foreground)] hover:opacity-70 transition-opacity"
            aria-label="Thu nhỏ chat"
          >
            <X size={16} />
          </button>
        </div>

        {/* Chat body */}
        <div className="flex-1 min-h-0">
          <JobSearchChat />
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-12 h-12 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label={open ? "Thu nhỏ chat" : "Mở chat tìm việc"}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>
    </div>
  );
}
