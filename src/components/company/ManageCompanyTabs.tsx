"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, FileText, Briefcase, Users, UserRound, MessageSquareText } from "lucide-react";
import CompanyProfileContent from "./profile/CompanyProfileContent";
import ManageCompanyPageContent from "./ManageCompanyPageContent";
import { Company } from "@/types/company";
import { Pencil } from "lucide-react";

type Props = {
  company: Company;
  initialTab: string;
};

export default function ManageCompanyTabs({ company, initialTab }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = searchParams.get("tab") || initialTab || "overview";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "overview") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
      <div className="flex flex-col md:flex-row items-center justify-between mb-12 border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-16 z-20 rounded-xl px-4 shadow-sm">
        <TabsList className="bg-transparent h-auto p-0 gap-6 w-full md:w-auto overflow-x-auto flex-nowrap justify-start py-2">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:text-[var(--brand)] data-[state=active]:bg-[var(--brand-light)] text-slate-500 font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-slate-900 shadow-none flex items-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" /> Tổng quan
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="data-[state=active]:text-[var(--brand)] data-[state=active]:bg-[var(--brand-light)] text-slate-500 font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-slate-900 shadow-none flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Hoạt động
          </TabsTrigger>
          <TabsTrigger
            value="jobs"
            className="data-[state=active]:text-[var(--brand)] data-[state=active]:bg-[var(--brand-light)] text-slate-500 font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-slate-900 shadow-none flex items-center gap-2"
          >
            <Briefcase className="w-4 h-4" /> Việc làm
          </TabsTrigger>
          <TabsTrigger
            value="applications"
            className="data-[state=active]:text-[var(--brand)] data-[state=active]:bg-[var(--brand-light)] text-slate-500 font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-slate-900 shadow-none flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Ứng tuyển
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="data-[state=active]:text-[var(--brand)] data-[state=active]:bg-[var(--brand-light)] text-slate-500 font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-slate-900 shadow-none flex items-center gap-2"
          >
            <UserRound className="w-4 h-4" /> Thành viên
          </TabsTrigger>
          <TabsTrigger
            value="tickets"
            className="data-[state=active]:text-[var(--brand)] data-[state=active]:bg-[var(--brand-light)] text-slate-500 font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-slate-900 shadow-none flex items-center gap-2"
          >
            <MessageSquareText className="w-4 h-4" /> Trao đổi
          </TabsTrigger>
        </TabsList>
      </div>

      {/* TAB: OVERVIEW (Editable Profile) */}
      <TabsContent value="overview" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <div className="bg-[var(--brand-light)] border border-[var(--brand)]/30 rounded-lg p-4 mb-8 flex items-center gap-3 text-[var(--brand-dark)]">
          <div className="bg-[var(--brand)]/10 p-2 rounded-full">
            <Pencil className="w-4 h-4 text-[var(--brand)]" />
          </div>
          <p className="text-sm font-medium">Bạn đang ở chế độ chỉnh sửa. Di chuột vào các mục để chỉnh sửa nội dung.</p>
        </div>
        <CompanyProfileContent company={company} isEditable={true} />
      </TabsContent>

      {/* Reuse existing ManageCompanyPageContent for complex logic of other tabs */}
      <TabsContent value="activity" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ManageCompanyPageContent company={company} />
      </TabsContent>

      <TabsContent value="jobs" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ManageCompanyPageContent company={company} />
      </TabsContent>

      <TabsContent value="applications" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ManageCompanyPageContent company={company} />
      </TabsContent>

      <TabsContent value="members" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ManageCompanyPageContent company={company} />
      </TabsContent>

      <TabsContent value="tickets" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
        <ManageCompanyPageContent company={company} />
      </TabsContent>
    </Tabs>
  );
}

