"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type Props = {
  initialTab: string;
  overview: ReactNode;
  activity: ReactNode;
  jobs: ReactNode;
};

const VALID_TABS = new Set(["overview", "activity", "jobs"]);

export default function CompanyProfileTabs({ initialTab, overview, activity, jobs }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<string>(VALID_TABS.has(initialTab) ? initialTab : "overview");

  useEffect(() => {
    if (VALID_TABS.has(initialTab)) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (next: string) => {
    if (!VALID_TABS.has(next)) return;
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Tổng quan</TabsTrigger>
        <TabsTrigger value="activity">Hoạt động</TabsTrigger>
        <TabsTrigger value="jobs">Việc làm</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">{overview}</TabsContent>
      <TabsContent value="activity">{activity}</TabsContent>
      <TabsContent value="jobs">{jobs}</TabsContent>
    </Tabs>
  );
}

