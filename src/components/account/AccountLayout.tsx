"use client";

import AccountTabs from "./AccountTabs";

type TabId = "account" | "profile" | "security";

interface AccountLayoutProps {
  activeTab: TabId;
  children: React.ReactNode;
}

export default function AccountLayout({ activeTab, children }: AccountLayoutProps) {
  return (
    <div className="flex gap-8">
      <AccountTabs activeTab={activeTab} />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}

