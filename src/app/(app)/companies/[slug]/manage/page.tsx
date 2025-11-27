"use client";

import { Suspense, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import EmptyState from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import CompanyManageTabs from "@/components/company/CompanyManageTabs";
import CompanyStoryRenderer from "@/components/company/CompanyStoryRenderer";
import CompanyActivityFeed from "@/components/company/CompanyActivityFeed";
import CompanyTicketsList from "@/components/company/CompanyTicketsList";
import CompanyPostComposer from "@/components/company/PostComposer";
import JobComposer from "@/components/company/JobComposer";
import EditCoverModal from "@/components/company/EditCoverModal";
import EditLogoModal from "@/components/company/EditLogoModal";
import EditCompanyInfoModal from "@/components/company/EditCompanyInfoModal";
import EditDescriptionModal from "@/components/company/EditDescriptionModal";
import EditMetricsModal from "@/components/company/EditMetricsModal";
import EditStoryModal from "@/components/company/EditStoryModal";
import CompanyMembersList from "@/components/company/CompanyMembersList";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Pencil } from "lucide-react";
import type { CompanyMetric, CompanyStoryBlock, CompanyHighlight } from "@/types/company";

type CompanyManageResponse = {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  website?: string | null;
  location?: string | null;
  industry?: string | null;
  size?: string | null;
  foundedYear?: number | null;
  headcount?: number | null;
  headcountNote?: string | null;
  metrics?: CompanyMetric[] | null;
  profileStory?: CompanyStoryBlock[] | null;
  highlights?: CompanyHighlight[] | null;
  stats?: {
    posts: number;
    jobs: number;
    followers: number;
  };
  members: Array<{
    id: string;
    userId: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      email: string;
      name?: string | null;
    };
  }>;
};

type PostItem = {
  id: string;
  title: string;
  content: string;
  type: string;
  visibility: string;
  publishedAt?: string | null;
  createdAt: string;
};

type JobItem = {
  id: string;
  title: string;
  description?: string;
  employmentType: string;
  experienceLevel: string;
  location?: string | null;
  remote: boolean;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency: string;
  isActive: boolean;
  createdAt: string;
};

type ApplicationItem = {
  id: string;
  status: string;
  appliedAt: string;
  user: {
    name?: string | null;
    email: string;
  };
  job: {
    id: string;
    title: string;
  };
};

const MAX_ITEMS = 10;

function ManageCompanyPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = Array.isArray(params?.slug) ? params?.slug[0] : (params?.slug as string | undefined);
  const memberships = useAuthStore((s) => s.memberships);
  const user = useAuthStore((s) => s.user);
  
  const tabParam = searchParams.get("tab");
  const normalizedTab = ["overview", "activity", "jobs", "applications", "members", "tickets"].includes(tabParam ?? "")
    ? (tabParam as string)
    : "overview";

  const membership = useMemo(
    () => memberships.find((m) => m.company.slug === slug),
    [memberships, slug]
  );

  // MEMBER can now access /manage but with limited permissions
  const canEdit = membership && ["OWNER", "ADMIN"].includes(membership.role);

  const queryClient = useQueryClient();
  const [editCoverOpen, setEditCoverOpen] = useState(false);
  const [editLogoOpen, setEditLogoOpen] = useState(false);
  const [editInfoOpen, setEditInfoOpen] = useState(false);
  const [editDescriptionOpen, setEditDescriptionOpen] = useState(false);
  const [editMetricsOpen, setEditMetricsOpen] = useState(false);
  const [editStoryOpen, setEditStoryOpen] = useState(false);

  const companyQuery = useQuery({
    queryKey: ["company-manage", slug],
    enabled: Boolean(slug) && Boolean(membership),
    queryFn: async () => {
      const res = await api.get(`/api/companies/${slug}`);
      return res.data.data.company as CompanyManageResponse;
    },
  });

  const companyId = companyQuery.data?.id;

  const postsQuery = useQuery({
    queryKey: ["company-posts", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const res = await api.get(`/api/posts/companies/${companyId}/posts`, {
        params: { page: 1, limit: MAX_ITEMS },
      });
      return res.data.data.posts as PostItem[];
    },
  });

  const jobsQuery = useQuery({
    queryKey: ["company-jobs", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const res = await api.get(`/api/jobs`, {
        params: { companyId, page: 1, limit: MAX_ITEMS },
      });
      return res.data.data.jobs as JobItem[];
    },
  });

  const applicationsQuery = useQuery({
    queryKey: ["company-applications", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const res = await api.get(`/api/jobs/applications`, {
        params: { companyId, page: 1, limit: MAX_ITEMS },
      });
      return res.data.data.applications as ApplicationItem[];
    },
  });

  const handleCoverUpdate = async (newUrl: string) => {
    // Update local cache
    queryClient.setQueryData(["company-manage", slug], (old: CompanyManageResponse | undefined) => {
      if (!old) return old;
      return { ...old, coverUrl: newUrl };
    });
    // Refetch to sync with server
    await companyQuery.refetch();
  };

  const handleLogoUpdate = async (newUrl: string) => {
    // Update local cache
    queryClient.setQueryData(["company-manage", slug], (old: CompanyManageResponse | undefined) => {
      if (!old) return old;
      return { ...old, logoUrl: newUrl };
    });
    // Refetch to sync with server
    await companyQuery.refetch();
  };

  const handleInfoUpdate = async () => {
    // Refetch to sync with server after info update
    await companyQuery.refetch();
  };

  const handleDescriptionUpdate = async () => {
    // Refetch to sync with server after description update
    await companyQuery.refetch();
  };

  const handleMetricsUpdate = async () => {
    // Refetch to sync with server after metrics update
    await companyQuery.refetch();
  };

  if (!slug) {
    return (
      <EmptyState title="Không tìm thấy công ty" subtitle="Slug không hợp lệ." />
    );
  }

  if (!membership) {
    return (
      <EmptyState
        title="Bạn không có quyền truy cập"
        subtitle="Chỉ thành viên của công ty mới có thể truy cập trang quản trị."
      />
    );
  }

  if (companyQuery.isLoading || !companyQuery.data) {
    return (
      <div className="mx-auto max-w-[1080px] space-y-6 p-4">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-10 w-1/3" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  const company = companyQuery.data;

  // Tab content
  const overviewContent = (
    <div className="space-y-4">
      {/* About first */}
      <CompanyStoryRenderer
        blocks={undefined}
        fallbackDescription={company.description}
        canEditDescription={Boolean(canEdit)}
        onEditDescription={() => setEditDescriptionOpen(true)}
      />

      {/* Metrics Section - Always visible with empty state, placed right after About */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Chỉ số nổi bật</h3>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditMetricsOpen(true)}>
              <Pencil className="mr-1 h-3 w-3" />
              Chỉnh sửa
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {company.metrics && company.metrics.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {company.metrics.map((metric, idx) => (
                <div
                  key={metric.id ?? idx}
                  className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4"
                >
                  <p className="text-sm font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{metric.value}</p>
                  {metric.description && (
                    <p className="mt-2 text-xs text-[var(--muted-foreground)]">{metric.description}</p>
                  )}
              </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/30 p-6 text-center text-sm text-[var(--muted-foreground)]">
              Chưa có chỉ số nào. {canEdit ? "Nhấn “Chỉnh sửa” để thêm ngay." : "Quản trị viên có thể thêm chỉ số tại đây."}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Story blocks wrapped in a card with edit action */}
            <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Câu chuyện doanh nghiệp</h3>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => setEditStoryOpen(true)}>
              <Pencil className="mr-1 h-3 w-3" />
              Chỉnh sửa
            </Button>
          )}
              </CardHeader>
        <CardContent>
          {company.profileStory && company.profileStory.length > 0 ? (
            <CompanyStoryRenderer blocks={company.profileStory} />
          ) : (
            <div className="rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--muted)]/30 p-6 text-center text-sm text-[var(--muted-foreground)]">
              Chưa có nội dung trình bày. {canEdit ? "Nhấn “Chỉnh sửa” để thêm ngay." : "Quản trị viên có thể thêm nội dung tại đây."}
            </div>
          )}
              </CardContent>
            </Card>
          </div>
  );

  const activityContent = (
          <div className="space-y-4">
      {canEdit && companyId ? (
              <CompanyPostComposer companyId={companyId} onCreated={() => postsQuery.refetch()} />
            ) : null}
      {postsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-32 w-full" />
          ))}
                      </div>
      ) : postsQuery.data && postsQuery.data.length > 0 ? (
        <CompanyActivityFeed
          posts={postsQuery.data.map(p => ({
            ...p,
            author: { id: '', email: '', name: null },
            company: { id: company.id, name: company.name, slug: company.slug, logoUrl: company.logoUrl ?? undefined },
            likesCount: 0,
            commentsCount: 0,
            isLiked: false,
            isSaved: false,
          }))}
          companyId={company.id}
        />
                    ) : (
        <EmptyState
          title="Chưa có bài viết công khai"
          subtitle="Khi doanh nghiệp đăng bài, nội dung sẽ hiển thị tại đây."
        />
                    )}
          </div>
  );

  const jobsContent = (
          <div className="space-y-4">
      {canEdit && companyId ? (
              <JobComposer companyId={companyId} onCreated={() => jobsQuery.refetch()} />
            ) : null}
      {jobsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-32 w-full" />
          ))}
        </div>
      ) : jobsQuery.data && jobsQuery.data.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {jobsQuery.data.map((job) => (
                <Card key={job.id}>
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
                  <span>
                    {job.remote ? "Remote" : job.location ?? "Không ghi rõ"} · {job.employmentType} · {job.experienceLevel}
                  </span>
                  <span>{new Date(job.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-base font-semibold text-[var(--foreground)] hover:text-[var(--brand)]"
                >
                  {job.title}
                </Link>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
                <p className="line-clamp-3 leading-relaxed">{job.description ?? "Chưa có mô tả"}</p>
                <div className="text-xs">
                  <p>Trạng thái: {job.isActive ? "Đang mở" : "Đã đóng"}</p>
                    </div>
                <Button asChild size="sm">
                  <Link href={`/jobs/${job.id}`}>Xem chi tiết</Link>
                      </Button>
                  </CardContent>
                </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Hiện chưa có job đang mở"
          subtitle="Khi doanh nghiệp mở job mới, bạn sẽ thấy tại đây."
        />
      )}
    </div>
  );

  const applicationsContent = applicationsQuery.isLoading ? (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, idx) => (
        <Skeleton key={idx} className="h-24 w-full" />
      ))}
          </div>
  ) : applicationsQuery.data && applicationsQuery.data.length > 0 ? (
    <div className="space-y-3">
      {applicationsQuery.data.map((application) => (
              <Card key={application.id}>
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-[var(--foreground)]">{application.job.title}</h3>
                    <p className="text-sm text-[var(--muted-foreground)]">{application.user.name ?? application.user.email}</p>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {new Date(application.appliedAt).toLocaleString()} • {application.status}
                  </p>
                </CardHeader>
              </Card>
      ))}
    </div>
  ) : (
    <EmptyState title="Chưa có hồ sơ ứng tuyển nào" subtitle="Khi có ứng viên nộp hồ sơ, sẽ hiển thị tại đây." />
  );

  const membersContent = (
    <CompanyMembersList
      companyId={company.id}
      members={company.members}
      currentUserRole={membership.role}
      currentUserId={user?.id ?? ""}
    />
  );

  const ticketsContent = companyId ? <CompanyTicketsList companyId={companyId} /> : null;

  return (
    <div className="mx-auto max-w-[1080px] space-y-6 p-4">
      {/* Company Hero - Similar to public page */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        {/* Cover Section */}
        <div className="relative h-72 w-full bg-gradient-to-br from-[var(--brand)]/15 via-transparent to-transparent">
          {company.coverUrl ? (
            <Image
              src={company.coverUrl}
              alt={company.name}
              fill
              priority
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Edit Cover Button */}
          {canEdit && (
            <button
              onClick={() => setEditCoverOpen(true)}
              className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-[var(--foreground)] shadow-lg transition hover:bg-white"
              title="Chỉnh sửa ảnh cover"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}

          {/* Logo and Name */}
          <div className="absolute bottom-5 left-6 flex flex-wrap items-end gap-4">
            <div className="relative">
              {company.logoUrl ? (
                <Image
                  src={company.logoUrl}
                  alt={company.name}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-2xl border-4 border-white/80 bg-white object-cover shadow-xl"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white/80 bg-white text-3xl font-semibold text-[var(--muted-foreground)] shadow-xl">
                  {company.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              
              {/* Edit Logo Button */}
              {canEdit && (
                <button
                  onClick={() => setEditLogoOpen(true)}
                  className="absolute -bottom-2 -right-2 rounded-full bg-white p-2 text-[var(--foreground)] shadow-lg transition hover:bg-[var(--muted)]"
                  title="Chỉnh sửa logo"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="space-y-2 text-white drop-shadow">
              <h1 className="text-2xl font-semibold">{company.name}</h1>
              {company.tagline ? (
                <p className="text-sm text-white/85">{company.tagline}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Company Info Section */}
        <div className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
            {company.industry && (
              <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-[var(--foreground)]">
                Ngành: {company.industry}
              </span>
            )}
            {company.location && (
              <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-[var(--foreground)]">
                Trụ sở: {company.location}
              </span>
            )}
            {company.size && (
              <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-[var(--foreground)]">
                Quy mô: {translateCompanySize(company.size)}
              </span>
            )}
            {company.foundedYear && (
              <span className="rounded-full bg-[var(--muted)] px-3 py-1 text-[var(--foreground)]">
                Thành lập: {company.foundedYear}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {company.website ? (
              <Button asChild variant="outline" size="sm">
                <Link href={company.website} target="_blank" rel="noreferrer">
                  🌐 Website
                </Link>
              </Button>
            ) : null}
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => setEditInfoOpen(true)}>
                <Pencil className="mr-1 h-3 w-3" />
                Chỉnh sửa thông tin
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 border-t border-[var(--border)] p-6">
          <div>
            <p className="text-xs uppercase text-[var(--muted-foreground)]">Bài viết</p>
            <p className="text-2xl font-semibold text-[var(--foreground)]">{company.stats?.posts ?? 0}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-[var(--muted-foreground)]">Việc làm</p>
            <p className="text-2xl font-semibold text-[var(--foreground)]">{company.stats?.jobs ?? 0}</p>
          </div>
    <div>
            <p className="text-xs uppercase text-[var(--muted-foreground)]">Người theo dõi</p>
            <p className="text-2xl font-semibold text-[var(--foreground)]">{company.stats?.followers ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <CompanyManageTabs
        initialTab={normalizedTab}
        overview={overviewContent}
        activity={activityContent}
        jobs={jobsContent}
        applications={applicationsContent}
        members={membersContent}
        tickets={ticketsContent}
      />

      {/* Modals */}
      {canEdit && companyId && (
        <>
          <EditCoverModal
            isOpen={editCoverOpen}
            onClose={() => setEditCoverOpen(false)}
            companyId={companyId}
            currentCoverUrl={company.coverUrl}
            onSuccess={handleCoverUpdate}
          />
          <EditLogoModal
            isOpen={editLogoOpen}
            onClose={() => setEditLogoOpen(false)}
            companyId={companyId}
            companyName={company.name}
            currentLogoUrl={company.logoUrl}
            onSuccess={handleLogoUpdate}
          />
          <EditCompanyInfoModal
            isOpen={editInfoOpen}
            onClose={() => setEditInfoOpen(false)}
            companyId={companyId}
            initialData={{
              name: company.name,
              tagline: company.tagline,
              website: company.website,
              location: company.location,
              industry: company.industry,
              size: company.size,
              foundedYear: company.foundedYear,
            }}
            onSuccess={handleInfoUpdate}
          />
          <EditDescriptionModal
            isOpen={editDescriptionOpen}
            onClose={() => setEditDescriptionOpen(false)}
            companyId={companyId}
            currentDescription={company.description}
            onSuccess={handleDescriptionUpdate}
          />
          <EditMetricsModal
            isOpen={editMetricsOpen}
            onClose={() => setEditMetricsOpen(false)}
            companyId={companyId}
            currentMetrics={company.metrics}
            onSuccess={handleMetricsUpdate}
          />
          <EditStoryModal
            isOpen={editStoryOpen}
            onClose={() => setEditStoryOpen(false)}
            companyId={companyId}
            initialStory={company.profileStory}
            fallbackDescription={company.description}
            onSuccess={async () => {
              await companyQuery.refetch();
            }}
          />
        </>
      )}
    </div>
  );
}

function translateCompanySize(size?: string | null) {
  switch (size) {
    case "STARTUP":
      return "Startup (1-20)";
    case "SMALL":
      return "Nhỏ (20-50)";
    case "MEDIUM":
      return "Vừa (50-200)";
    case "LARGE":
      return "Lớn (200-1000)";
    case "ENTERPRISE":
      return "Tập đoàn (>1000)";
    default:
      return "Đang cập nhật";
  }
}

export default function ManageCompanyPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-[1080px] space-y-6 p-4">
        <Skeleton className="h-64 rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </div>
    }>
      <ManageCompanyPageContent />
    </Suspense>
  );
}
