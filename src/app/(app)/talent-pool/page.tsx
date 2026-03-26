"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuth";
import TalentPoolExplorer from "@/components/talent-pool/TalentPoolExplorer";
import TalentPoolLocked from "@/components/talent-pool/TalentPoolLocked";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type AccessResult = {
  hasAccess: boolean;
  reason?: string;
};

export default function TalentPoolPage() {
  const { user, initialized, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !loading && user === null) {
      router.replace("/login");
    }
  }, [initialized, loading, user, router]);

  const { data: access, isLoading: accessLoading } = useQuery<AccessResult>({
    queryKey: ["talent-pool-access"],
    queryFn: async () => {
      const res = await api.get("/api/talent-pool/access");
      return res.data.data;
    },
    enabled: initialized && !loading && !!user,
  });

  if (!initialized || loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (accessLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-6">
      {/* Company explorer OR locked */}
      {access?.hasAccess ? (
        <TalentPoolExplorer />
      ) : (
        <TalentPoolLocked reason={access?.reason} />
      )}
    </div>
  );
}
