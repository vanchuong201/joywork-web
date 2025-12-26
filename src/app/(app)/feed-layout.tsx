"use client";

import RightRail from "@/components/common/RightRail";

export default function FeedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex gap-8">
      <div className="flex-1 min-w-0">
        {children}
      </div>
      <RightRail />
    </div>
  );
}

