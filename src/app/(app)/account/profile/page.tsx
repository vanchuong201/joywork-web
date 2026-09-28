"use client";

import { Suspense } from "react";
import AccountLayout from "@/components/account/AccountLayout";
import MyCvsScreen from "@/components/account/cv/MyCvsScreen";
import { Skeleton } from "@/components/ui/skeleton";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function AccountProfilePage() {
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
          <AccountLayout>
            <MyCvsScreen />
          </AccountLayout>
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
