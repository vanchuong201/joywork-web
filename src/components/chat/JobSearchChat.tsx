"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { JobResultsList, JobSearchResult } from "./JobResultsList";

export function JobSearchChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

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
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                message.role === "user"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] rounded-br-sm"
                  : "bg-[var(--muted)] text-[var(--foreground)] rounded-bl-sm"
              }`}
            >
              {/* Tool invocation results (job search results) */}
              {message.parts?.map((part, i) => {
                if (part.type === "tool-invocation" && part.toolInvocation.state === "result") {
                  const result = part.toolInvocation.result as { jobs?: JobSearchResult[] };
                  if (result?.jobs && result.jobs.length > 0) {
                    return <JobResultsList key={i} jobs={result.jobs} />;
                  }
                }
                return null;
              })}

              {/* Text content */}
              {message.content && (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
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
        onSubmit={handleSubmit}
        className="flex gap-2 p-3 border-t border-[var(--border)]"
      >
        <input
          value={input}
          onChange={handleInputChange}
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
