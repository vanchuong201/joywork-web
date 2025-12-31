"use client";

import { useSearchParams } from "next/navigation";
import { Company } from "@/types/company";
import PostComposer from "./PostComposer";
import CompanyActivityFeed from "./CompanyActivityFeed";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Users, UserRound, MessageSquareText } from "lucide-react";
import { useState } from "react";
import CompanyMembersList from "./CompanyMembersList";
import CompanyTicketsList from "./CompanyTicketsList";
import { useAuthStore } from "@/store/useAuth";
import ManageJobsTab from "./ManageJobsTab";
import ManageApplicationsTab from "./ManageApplicationsTab";

export default function ManageCompanyPageContent({ company }: { company: Company }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  const user = useAuthStore((s) => s.user);

  // Fetch company with members for members tab (to ensure fresh data)
  const companyWithMembersQuery = useQuery({
      queryKey: ["company-with-members", company.id],
      queryFn: async () => {
          const res = await api.get(`/api/companies/${company.slug}`);
          return res.data.data.company;
      },
      enabled: tab === "members",
      initialData: company, // Use initial company data
  });

  // Sử dụng company data từ query nếu có, nếu không thì dùng company ban đầu
  const companyData = companyWithMembersQuery.data || company;
  
  // Tìm membership của user hiện tại trong company
  const currentMembership = companyData.members?.find((m: NonNullable<Company['members']>[number]) => m.userId === user?.id);
  const currentUserRole = currentMembership?.role || "MEMBER";
  const currentUserId = user?.id || "";

  if (tab === "overview") return null;

  return (
    <div className="py-8">
        {/* Tab: Activity */}
        {tab === "activity" && (
            <div className="max-w-3xl mx-auto space-y-8">
                <PostComposer companyId={company.id} />
                <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4 text-slate-800">Bài viết đã đăng</h3>
                    {/* Pass empty array, component will fetch data */}
                    <CompanyActivityFeed posts={[]} companyId={company.id} /> 
                </div>
            </div>
        )}

        {/* Tab: Jobs */}
        {tab === "jobs" && <ManageJobsTab company={company} />}

        {/* Tab: Applications */}
        {tab === "applications" && <ManageApplicationsTab company={company} />}

        {/* Tab: Members */}
        {tab === "members" && (
            <div className="space-y-6">
                {companyWithMembersQuery.isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="h-20 bg-white rounded-lg border border-slate-200 animate-pulse" />
                        ))}
                    </div>
                ) : companyData.members && companyData.members.length > 0 ? (
                    <CompanyMembersList
                        companyId={company.id}
                        members={companyData.members}
                        invitations={companyData.invitations || []}
                        currentUserRole={currentUserRole}
                        currentUserId={currentUserId}
                    />
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-slate-300" />
                        </div>
                        <h4 className="font-bold text-lg text-slate-700 mb-2">Chưa có thành viên</h4>
                        <p>Thêm thành viên để bắt đầu quản lý công ty.</p>
                    </div>
                )}
            </div>
        )}

        {/* Tab: Tickets */}
        {tab === "tickets" && (
            <div className="space-y-6">
                <CompanyTicketsList companyId={company.id} />
            </div>
        )}
    </div>
  );
}

