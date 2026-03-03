"use client";

import AccountTabs from "./AccountTabs";

type TabId = "account" | "profile" | "security";

interface AccountLayoutProps {
  activeTab: TabId;
  children: React.ReactNode;
}

export default function AccountLayout({ activeTab, children }: AccountLayoutProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-8">
      <AccountTabs activeTab={activeTab} />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}

