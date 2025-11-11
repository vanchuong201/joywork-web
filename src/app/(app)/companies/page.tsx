"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import Link from "next/link";

type Membership = {
  membershipId: string;
  role: string;
  company: {
    id: string;
    name: string;
    slug: string;
    tagline?: string | null;
  };
};

export default function MyCompaniesPage() {
  const { data, isLoading } = useQuery<{ memberships: Membership[] }>({
    queryKey: ["my-companies"],
    queryFn: async () => {
      const res = await api.get("/api/companies/me/companies");
      return res.data.data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Companies</h1>
        <Button asChild>
          <Link href="/companies/new">+ Create New Company</Link>
        </Button>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : data?.memberships?.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.memberships.map((membership) => (
            <Card key={membership.membershipId}>
              <CardHeader className="pb-2">
                <div className="text-base font-semibold">{membership.company.name}</div>
                <div className="text-xs uppercase text-[var(--brand)]">{membership.role}</div>
                {membership.company.tagline ? (
                  <div className="text-sm text-[var(--muted-foreground)]">{membership.company.tagline}</div>
                ) : null}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/companies/${membership.company.slug}`}>Xem trang</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/companies/${membership.company.slug}/manage`}>Quản trị</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Bạn chưa tham gia công ty nào"
          subtitle="Hãy tạo công ty đầu tiên hoặc nhận lời mời tham gia từ quản trị viên."
        />
      )}
    </div>
  );
}


