"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AccountLayout from "@/components/account/AccountLayout";
import AccountTab from "@/components/account/AccountTab";
import SecurityTab from "@/components/account/SecurityTab";
import { Skeleton } from "@/components/ui/skeleton";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

function AccountPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get("tab");

  useEffect(() => {
    if (tab === "profile") {
      router.replace("/account/profile");
    }
  }, [tab, router]);

  if (tab === "profile") {
    return null;
  }

  return (
    <AccountLayout>
      {tab === "security" ? <SecurityTab /> : <AccountTab />}
    </AccountLayout>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <Suspense
          fallback={
            <div>
              <Skeleton className="mb-4 h-10 w-48 sm:mb-6" />
              <Skeleton className="h-96 w-full" />
            </div>
          }
        >
          <AccountPageContent />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
