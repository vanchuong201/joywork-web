"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

type Props = {
  initialTab: string;
  overview: ReactNode;
  stories: ReactNode;
  jobs: ReactNode;
  applications: ReactNode;
  members: ReactNode;
  tickets: ReactNode;
};

const VALID_TABS = new Set(["overview", "stories", "jobs", "applications", "members", "tickets"]);

export default function CompanyManageTabs({
  initialTab,
  overview,
  stories,
  jobs,
  applications,
  members,
  tickets,
}: Props) {
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
        <TabsTrigger value="stories">Stories</TabsTrigger>
        <TabsTrigger value="jobs">Việc làm</TabsTrigger>
        <TabsTrigger value="applications">Ứng tuyển</TabsTrigger>
        <TabsTrigger value="members">Thành viên</TabsTrigger>
        <TabsTrigger value="tickets">Tickets</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">{overview}</TabsContent>
      <TabsContent value="stories">{stories}</TabsContent>
      <TabsContent value="jobs">{jobs}</TabsContent>
      <TabsContent value="applications">{applications}</TabsContent>
      <TabsContent value="members">{members}</TabsContent>
      <TabsContent value="tickets">{tickets}</TabsContent>
    </Tabs>
  );
}

