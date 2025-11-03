"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { useState } from "react";
import { toast } from "sonner";

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
};

export default function ThreadPage() {
  const params = useParams<{ applicationId: string }>();
  const applicationId = params?.applicationId as string;
  const qc = useQueryClient();
  const [content, setContent] = useState("");

  const { data, isLoading } = useQuery<{ messages: Message[] }>({
    queryKey: ["messages", applicationId],
    queryFn: async () => {
      const res = await api.get("/api/inbox/messages", { params: { applicationId } });
      return res.data.data;
    },
    enabled: !!applicationId,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/inbox/messages", { applicationId, content });
    },
    onSuccess: () => {
      toast.success("Message sent");
      setContent("");
      qc.invalidateQueries({ queryKey: ["messages", applicationId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to send"),
  });

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      <div className="flex-1 space-y-2 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-2/3" />
            ))}
          </div>
        ) : data?.messages?.length ? (
          data?.messages?.map((m) => (
            <div key={m.id} className="text-sm">
              <div className="font-medium text-[var(--muted-foreground)]">{new Date(m.createdAt).toLocaleString()}</div>
              <div>{m.content}</div>
            </div>
          ))
        ) : (
          <EmptyState title="No messages yet" subtitle="Start the conversation" />
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!content.trim()) return;
          sendMutation.mutate();
        }}
        className="mt-3 flex items-end gap-2"
      >
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a message..."
          rows={3}
        />
        <Button disabled={sendMutation.isPending}>{sendMutation.isPending ? "Sending..." : "Send"}</Button>
      </form>
    </div>
  );
}


