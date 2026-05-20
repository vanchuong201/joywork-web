"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { JobResultsList, JobSearchResult } from "./JobResultsList";

export function JobSearchChat() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");
  const isLoading = status === "submitted" || status === "streaming";

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-[var(--muted-foreground)] mt-8 px-4">
            <p className="font-medium text-[var(--foreground)] mb-1">Tìm việc cùng JoyWork</p>
            <p>Hãy mô tả vị trí bạn đang tìm kiếm và tôi sẽ giúp bạn tìm công việc phù hợp!</p>
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
              {message.parts.map((part, i) => {

                if (part.type === "text") {
                  return <p key={`${message.id}-${i}`} className="whitespace-pre-wrap">{part.text}</p>
                }

                if (part.type === "tool-searchJobsTool") {
                  if (part.state === "output-available") {
                    return part.output.jobs.length > 0 ? (
                      <>
                        <p className="whitespace-pre-wrap">Chúng tôi thấy một vài công việc phù hợp với bạn.</p>
                        <JobResultsList key={`${message.id}-${i}`} jobs={part.output.jobs} />
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap">Không tìm thấy công việc nào phù hợp.</p>
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
