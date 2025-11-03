"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";

type Conversation = {
  id: string;
  applicationId: string;
  lastMessage?: { content: string; createdAt: string };
  job: { id: string; title: string; company: { name: string } };
  unreadCount: number;
};

export default function InboxPage() {
  const { data, isLoading } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await api.get("/api/inbox/conversations");
      return res.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Inbox</h1>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : data?.conversations?.length ? (
        <div className="space-y-2">
          {data?.conversations?.map((c) => (
            <a key={c.id} href={`/inbox/${c.applicationId}`}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="text-sm text-[var(--muted-foreground)]">{c.job.company.name}</div>
                  <div className="font-semibold">{c.job.title}</div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-[var(--muted-foreground)]">
                    <span className="line-clamp-1">{c.lastMessage?.content ?? "No messages yet"}</span>
                    {c.unreadCount > 0 && (
                      <span className="rounded-full bg-[var(--brand)] px-2 py-0.5 text-xs text-white">{c.unreadCount}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </a>
          ))}
        </div>
      ) : (
        <EmptyState title="No conversations" subtitle="Start messaging candidates or HR" />
      )}
    </div>
  );
}


