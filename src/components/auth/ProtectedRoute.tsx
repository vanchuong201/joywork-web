"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const loading = useAuthStore((state) => state.loading);

  useEffect(() => {
    if (initialized && !loading && !user) {
      // Redirect to home if not authenticated
      router.push("/");
    }
  }, [user, initialized, loading, router]);

  // Show loading while checking auth
  if (!initialized || loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex gap-8">
          <div className="w-64 shrink-0">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-10 w-48 mb-6" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
