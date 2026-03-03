"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AccountLayout from "@/components/account/AccountLayout";
import AccountTab from "@/components/account/AccountTab";
import ProfileTab from "@/components/account/ProfileTab";
import SecurityTab from "@/components/account/SecurityTab";
import { Skeleton } from "@/components/ui/skeleton";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

type TabId = "account" | "profile" | "security";

function AccountPageContent() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") || "account") as TabId;

  // Validate tab
  const validTabs: TabId[] = ["account", "profile", "security"];
  const activeTab = validTabs.includes(tab) ? tab : "account";

  return (
    <AccountLayout activeTab={activeTab}>
      {activeTab === "account" && <AccountTab />}
      {activeTab === "profile" && <ProfileTab />}
      {activeTab === "security" && <SecurityTab />}
    </AccountLayout>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <Suspense
          fallback={
            <div className="flex flex-col gap-4 md:flex-row md:gap-8">
              <div className="w-full md:w-64 md:shrink-0">
                <Skeleton className="h-96 w-full" />
              </div>
              <div className="flex-1">
                <Skeleton className="mb-4 h-10 w-48 sm:mb-6" />
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          }
        >
          <AccountPageContent />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
