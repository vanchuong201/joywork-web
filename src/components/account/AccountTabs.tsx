"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, FileText, Shield } from "lucide-react";

type TabId = "account" | "profile" | "security";

interface Tab {
  id: TabId;
  label: string;
  icon: typeof User;
}

const tabs: Tab[] = [
  { id: "account", label: "Quản lý tài khoản", icon: User },
  { id: "profile", label: "Hồ sơ ứng tuyển", icon: FileText },
  { id: "security", label: "Bảo mật", icon: Shield },
];

interface AccountTabsProps {
  activeTab: TabId;
}

export default function AccountTabs({ activeTab }: AccountTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (tabId: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tabId);
    router.push(`/account?${params.toString()}`);
  };

  return (
    <div className="w-64 shrink-0">
      <div className="sticky top-24 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

