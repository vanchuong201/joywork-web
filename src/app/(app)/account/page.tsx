"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AccountLayout from "@/components/account/AccountLayout";
import AccountTab from "@/components/account/AccountTab";
import ProfileTab from "@/components/account/ProfileTab";
import SecurityTab from "@/components/account/SecurityTab";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="mx-auto max-w-7xl px-6 py-6">
      <Suspense
        fallback={
          <div className="flex gap-8">
            <div className="w-64 shrink-0">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-10 w-48 mb-6" />
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        }
      >
        <AccountPageContent />
      </Suspense>
    </div>
  );
}
