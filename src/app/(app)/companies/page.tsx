"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";

type Company = { id: string; name: string; slug: string; tagline?: string };

export default function MyCompaniesPage() {
  const { data, isLoading } = useQuery<{ companies: Company[] }>({
    queryKey: ["my-companies"],
    queryFn: async () => {
      const res = await api.get("/api/companies/me");
      return res.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Companies</h1>
        <a href="/companies/new">
          <Button>+ Create New Company</Button>
        </a>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : data?.companies?.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data?.companies?.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="text-base font-semibold">{c.name}</div>
                <div className="text-sm text-[var(--muted-foreground)]">{c.tagline}</div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <a href={`/companies/${c.slug}`}>
                    <Button size="sm" variant="secondary">View</Button>
                  </a>
                  <a href={`/companies/${c.id}/settings`}>
                    <Button size="sm" variant="outline">Edit</Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No companies yet" subtitle="Create your first company profile" />
      )}
    </div>
  );
}


