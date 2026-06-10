"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Trash2 } from "lucide-react";
import { JobResultsList } from "./JobResultsList";
import { useRouter } from "next/navigation";
import { CompanyAvatar } from "@/components/company/CompanyAvatar";

const STORAGE_KEY = "joywork-ai-chat-messages";

function readStoredMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as UIMessage[];
  } catch {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors (private mode, quota)
    }
  }
  return [];
}

const QUICK_PROMPTS = [
  "Lập trình viên React tại Hà Nội",
  "Marketing bán thời gian TP.HCM",
  "Thực tập IT",
];

export function JobSearchChat() {
  const router = useRouter();
  const { messages, sendMessage, status, setMessages, error } = useChat();
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const isLoading = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hydrated) return;
    const stored = readStoredMessages();
    if (stored.length > 0) {
      setMessages(stored);
    }
    setHydrated(true);
  }, [hydrated, setMessages]);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    try {
      if (messages.length === 0) {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } else {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      }
    } catch {
      // ignore storage errors (private mode, quota)
    }
  }, [messages, hydrated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleClearChat = () => {
    setMessages([]);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore storage errors (private mode, quota)
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {hasMessages && (
        <div className="flex items-center justify-end px-3 py-1.5 border-b border-[var(--border)] bg-[var(--background)]">
          <button
            type="button"
            onClick={handleClearChat}
            disabled={isLoading}
            className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Xóa đoạn chat"
          >
            <Trash2 size={12} />
            <span>Xóa đoạn chat</span>
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-[var(--muted-foreground)] mt-8 px-4">
            <p className="font-medium text-[var(--foreground)] mb-1">Tìm việc cùng JOYWORK</p>
            <p>Hãy mô tả vị trí bạn đang tìm kiếm và tôi sẽ giúp bạn tìm công việc phù hợp!</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {QUICK_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage({ text: prompt })}
                  disabled={isLoading}
                  className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1 text-xs text-[var(--foreground)] hover:border-[var(--brand)]/40 hover:text-[var(--brand)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${message.role === "user"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] rounded-br-sm"
                : "bg-[var(--muted)] text-[var(--foreground)] rounded-bl-sm"
                }`}
            >
              {message.parts.map((part: any, i) => {

                if (part.type === "text") {
                  return <p key={`${message.id}-${i}`} className="whitespace-pre-wrap">{part.text}</p>
                }

                if (part.type === "tool-searchJobsTool") {
                  if (part.state === "output-available") {
                    return part.output.jobs.length > 0 ? (
                      <JobResultsList key={`${message.id}-${i}`} jobs={part.output.jobs} />
                    ) : (
                      <p key={`${message.id}-${i}`} className="whitespace-pre-wrap">
                        Chưa tìm thấy công việc phù hợp. Bạn thử mô tả khác hoặc bỏ bớt tiêu chí (địa điểm, mức lương) xem nhé.
                      </p>
                    )
                  }
                }

                if (part.type === "tool-searchCompaniesTool") {
                  if (part.state === "output-available") {
                    return part.output.length > 0 ? (
                      <div key={`${message.id}-${i}`}>
                        <p className="whitespace-pre-wrap">Các công ty phù hợp.</p>
                        <div className="flex flex-col gap-2 mt-1">
                          {part.output.map((c: any) => (
                            <div
                              key={c.id}
                              onClick={() => router.push(`/companies/${c.slug}`)}
                              className="group flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5 transition-all hover:border-[var(--brand)]/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                            >
                              <CompanyAvatar
                                logoUrl={c.logoUrl}
                                isGood={c.isGood}
                                name={c.name}
                                size={48}
                                shape="square"
                                imgClassName="object-cover"
                                fallback={
                                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-[var(--muted)] text-base font-semibold text-[var(--muted-foreground)]">
                                    {c.name.slice(0, 2).toUpperCase()}
                                  </div>
                                }
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--brand)] transition-colors">
                                  {c.name}
                                </p>
                                <p>{c.size}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p key={`${message.id}-${i}`} className="whitespace-pre-wrap">Chúng tôi không thấy công ty nào phù hợp với yêu cầu của bạn.</p>
                    )
                  }
                }

                return null;
              })}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[var(--muted)] rounded-2xl rounded-bl-sm px-3 py-2">
              <Loader2 size={14} className="animate-spin text-[var(--muted-foreground)]" />
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-red-50 text-red-700 px-3 py-2 text-sm border border-red-100">
              JOYWORK AI tạm thời không phản hồi. Vui lòng thử lại sau ít phút.
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={e => {
          e.preventDefault();
          if (!input.trim()) return;
          sendMessage({ text: input });
          setInput("");
        }}
        className="flex gap-2 p-3 border-t border-[var(--border)]"
      >
        <input
          value={input}
          onChange={e => setInput(e.currentTarget.value)}
          placeholder="Nhập vị trí, ngành nghề mong muốn..."
          disabled={isLoading}
          className="flex-1 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex-shrink-0 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] p-2 hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
