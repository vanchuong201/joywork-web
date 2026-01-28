"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
};

export default function CompanyManageGuard({ children }: Props) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  
  const user = useAuthStore((state) => state.user);
  const memberships = useAuthStore((state) => state.memberships);
  const initialized = useAuthStore((state) => state.initialized);
  const loading = useAuthStore((state) => state.loading);
  const fetchMe = useAuthStore((state) => state.fetchMe);

  const [checking, setChecking] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    // Wait for auth to initialize
    if (!initialized || loading) {
      return;
    }

    // If not authenticated, redirect
    if (!user) {
      router.push("/");
      return;
    }

    // Check if user has permission (OWNER or ADMIN role for this company)
    const membership = memberships.find(
      (m) => m.company.slug === slug && (m.role === "OWNER" || m.role === "ADMIN")
    );

    if (membership) {
      setHasPermission(true);
      setChecking(false);
    } else {
      // If memberships are empty, try to fetch them
      if (memberships.length === 0) {
        fetchMe()
          .then(() => {
            const updatedMemberships = useAuthStore.getState().memberships;
            const updatedMembership = updatedMemberships.find(
              (m) => m.company.slug === slug && (m.role === "OWNER" || m.role === "ADMIN")
            );
            if (updatedMembership) {
              setHasPermission(true);
            }
            setChecking(false);
          })
          .catch(() => {
            setChecking(false);
          });
      } else {
        // No permission
        setChecking(false);
      }
    }
  }, [user, memberships, slug, initialized, loading, router, fetchMe]);

  // Show loading while checking
  if (!initialized || loading || checking) {
    return (
      <div className="min-h-screen bg-[var(--background)] font-sans pb-20">
        <div className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-30 px-6 py-3">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Show error if no permission
  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-[var(--background)] font-sans pb-20">
        <div className="bg-[var(--card)] border-b border-[var(--border)] sticky top-0 z-30 px-6 py-3">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Không có quyền truy cập</AlertTitle>
            <AlertDescription className="mt-2">
              Bạn không có quyền quản lý công ty này. Chỉ chủ sở hữu và quản trị viên mới có thể truy cập trang này.
            </AlertDescription>
            <div className="mt-4 flex gap-2">
              <Button asChild variant="outline">
                <Link href="/">Về trang chủ</Link>
              </Button>
              {slug && (
                <Button asChild variant="outline">
                  <Link href={`/companies/${slug}`}>Xem trang công ty</Link>
                </Button>
              )}
            </div>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
