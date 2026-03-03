"use client";

import { useSearchParams } from "next/navigation";
import { Company } from "@/types/company";
import PostComposer from "./PostComposer";
import CompanyActivityFeed from "./CompanyActivityFeed";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Users } from "lucide-react";
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
    <div className="-mx-1 space-y-5 pb-8 sm:mx-0 sm:space-y-6">
        {/* Tab: Activity */}
        {tab === "activity" && (
            <div className="mx-auto max-w-4xl space-y-5 sm:space-y-6">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-4">
                    <h3 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">Tạo bài đăng mới</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Chia sẻ thông tin tuyển dụng, hoạt động và cập nhật mới từ doanh nghiệp.
                    </p>
                </div>
                <PostComposer companyId={company.id} />
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-5">
                    <h3 className="mb-4 text-base font-semibold text-[var(--foreground)] sm:text-lg">Bài viết đã đăng</h3>
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
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-5">
                    <h3 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">Quản lý thành viên</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Mời cộng sự, phân quyền và theo dõi các lời mời đang chờ trong một nơi.
                    </p>
                </div>
                {companyWithMembersQuery.isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="h-20 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)]" />
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
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted-foreground)]">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
                            <Users className="w-8 h-8 text-[var(--muted-foreground)]" />
                        </div>
                        <h4 className="mb-2 text-lg font-bold text-[var(--foreground)]">Chưa có thành viên</h4>
                        <p>Thêm thành viên để bắt đầu quản lý công ty.</p>
                    </div>
                )}
            </div>
        )}

        {/* Tab: Tickets */}
        {tab === "tickets" && (
            <div className="space-y-6">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 sm:p-5">
                    <h3 className="text-base font-semibold text-[var(--foreground)] sm:text-lg">Trao đổi với ứng viên</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      Theo dõi ticket mới, cập nhật trạng thái phản hồi và xử lý hội thoại nhanh hơn.
                    </p>
                </div>
                <CompanyTicketsList companyId={company.id} />
            </div>
        )}
    </div>
  );
}

