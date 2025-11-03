"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Company = { id: string; name: string; slug: string };
type Post = { id: string; title: string };

export default function RightRail() {
  const { data, isLoading } = useQuery<{ companies?: Company[] } | Company[]>({
    queryKey: ["top-companies"],
    queryFn: async () => {
      const res = await api.get("/api/companies", { params: { q: "", limit: 4 } });
      return res.data.data;
    },
  });
  const hot = useQuery<{ posts?: Post[] } | Post[]>({
    queryKey: ["hot-posts"],
    queryFn: async () => {
      const res = await api.get("/api/posts", { params: { limit: 3 } });
      return res.data.data;
    },
  });
  return (
    <aside className="hidden w-72 shrink-0 border-l border-[var(--border)] bg-[var(--card)] p-4 lg:block">
      <section>
        <h3 className="mb-3 text-sm font-semibold">Top Companies</h3>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-40" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
            {(Array.isArray(data) ? data : data?.companies ?? []).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2">
                <a className="hover:text-[var(--foreground)]" href={`/companies/${c.slug}`}>
                  {c.name}
                </a>
                <Button size="sm" variant="outline" onClick={() => toast.info("Follow coming soon")}>Follow</Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-6">
        <h3 className="mb-3 text-sm font-semibold">Hot Stories</h3>
        {hot.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-48" />
            ))}
          </div>
        ) : (
          <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
            {(Array.isArray(hot.data) ? hot.data : hot.data?.posts ?? []).map((p) => (
              <li key={p.id}>
                <a className="hover:text-[var(--foreground)]" href={`/?highlight=${p.id}`}>{p.title}</a>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-6">
        <h3 className="mb-3 text-sm font-semibold">Suggested to Follow</h3>
        <p className="text-sm text-[var(--muted-foreground)]">
          Discover more innovative companies that match your interests.
        </p>
      </section>
    </aside>
  );
}


