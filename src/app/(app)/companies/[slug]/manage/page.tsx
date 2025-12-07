"use client";

import { Suspense, useState, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import EmptyState from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import * as Popover from "@radix-ui/react-popover";
import CompanyManageTabs from "@/components/company/CompanyManageTabs";
import CompanyStoryRenderer from "@/components/company/CompanyStoryRenderer";
import CompanyActivityFeed from "@/components/company/CompanyActivityFeed";
import CompanyTicketsList from "@/components/company/CompanyTicketsList";
import CompanyPostComposer from "@/components/company/PostComposer";
import EditCoverModal from "@/components/company/EditCoverModal";
import EditLogoModal from "@/components/company/EditLogoModal";
import EditCompanyInfoModal from "@/components/company/EditCompanyInfoModal";
import EditDescriptionModal from "@/components/company/EditDescriptionModal";
import EditMetricsModal from "@/components/company/EditMetricsModal";
import EditStoryModal from "@/components/company/EditStoryModal";
import CompanyMembersList from "@/components/company/CompanyMembersList";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Pencil, MoreVertical } from "lucide-react";
import CreateJobModal from "@/components/company/CreateJobModal";
import EditJobModal from "@/components/company/EditJobModal";
import { Badge } from "@/components/ui/badge";
import CompanyFollowersModal from "@/components/company/CompanyFollowersModal";
import type { CompanyMetric, CompanyStoryBlock, CompanyHighlight } from "@/types/company";
import { toast } from "sonner";

type CompanyManageResponse = {
  id: string;
  name: string;
  legalName?: string | null;
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
      avatar?: string | null;
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
  images?: { id: string; url: string; width?: number | null; height?: number | null; order?: number }[];
  jobs?: { id: string; title: string; location?: string | null; employmentType: string; isActive: boolean }[];
  hashtags?: { id: string; slug: string; label: string }[];
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
  _count?: { applications: number };
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
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [editJobId, setEditJobId] = useState<string | null>(null);
  const [followersOpen, setFollowersOpen] = useState(false);
  const router = useRouter();
  const [menuOpenForJobId, setMenuOpenForJobId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");

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
    queryKey: ["company-jobs", companyId, statusFilter],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const res = await api.get(`/api/jobs`, {
        params: {
          companyId,
          page: 1,
          limit: MAX_ITEMS,
          ...(statusFilter === "all" ? {} : { isActive: statusFilter === "open" }),
        },
      });
      return res.data.data.jobs as JobItem[];
    },
  });

  const selectedJobId = searchParams.get("jobId") || undefined;

  const applicationsQuery = useQuery({
    queryKey: ["company-applications", companyId],
    enabled: Boolean(companyId),
    queryFn: async () => {
      const res = await api.get(`/api/jobs/applications`, {
        params: { companyId, jobId: selectedJobId, page: 1, limit: MAX_ITEMS },
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
            images: p.images,
            jobs: p.jobs,
            hashtags: p.hashtags,
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

  const stripHtml = (html?: string | null) => {
    if (!html) return "";
    return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  };

  const closeJob = async (jobId: string) => {
    try {
      await api.patch(`/api/jobs/${jobId}`, { isActive: false });
      toast.success("Đã đóng job");
      await jobsQuery.refetch();
    } catch (e: any) {
      toast.error(e?.response?.data?.error?.message ?? "Không thể đóng job");
    } finally {
      setMenuOpenForJobId(null);
    }
  };

  const jobsContent = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="job-status-filter" className="text-[var(--muted-foreground)]">
            Trạng thái:
          </label>
          <select
            id="job-status-filter"
            className="h-9 rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Tất cả</option>
            <option value="open">Đang mở</option>
            <option value="closed">Đã đóng</option>
          </select>
        </div>
        {canEdit && companyId ? (
          <div className="flex items-center justify-end">
            <Button size="sm" onClick={() => setCreateJobOpen(true)}>
              + Đăng job mới
            </Button>
          </div>
        ) : null}
      </div>
      {jobsQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-32 w-full" />
          ))}
        </div>
      ) : jobsQuery.data && jobsQuery.data.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {jobsQuery.data
            .filter((job) =>
              statusFilter === "all" ? true : statusFilter === "open" ? job.isActive : !job.isActive,
            )
            .map((job) => (
                <Card key={job.id}>
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-[var(--foreground)] truncate">{job.title}</div>
                    <div className="mt-1">
                      <Badge
                        className={
                          (job.isActive
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-rose-100 text-rose-700 border border-rose-200")
                        }
                      >
                        {job.isActive ? "Đang mở" : "Đã đóng"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <span>{job.remote ? "Remote" : job.location ?? "Không ghi rõ"}</span>
                      <span>·</span>
                      <span>{job.employmentType}</span>
                      <span>·</span>
                      <span>{job.experienceLevel}</span>
                    </div>
                  </div>
                  {canEdit ? (
                    <Popover.Root open={menuOpenForJobId === job.id} onOpenChange={(o) => setMenuOpenForJobId(o ? job.id : null)}>
                      <Popover.Trigger asChild>
                        <button
                          className="rounded p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                          aria-label="Mở menu"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content className="z-50 mt-2 w-44 rounded-md border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg">
                          <button
                            className="w-full rounded px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                            onClick={() => closeJob(job.id)}
                            disabled={!job.isActive}
                          >
                            Đóng job
                          </button>
                          <button
                            className="w-full rounded px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                            onClick={() => {
                              setMenuOpenForJobId(null);
                              setEditJobId(job.id);
                            }}
                          >
                            Chỉnh sửa
                          </button>
                          <Link
                            href={`/jobs/${job.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-[var(--muted)]"
                            onClick={() => setMenuOpenForJobId(null)}
                          >
                            Xem công khai
                          </Link>
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  ) : null}
                </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
                <div className="flex items-center justify-between text-xs">
                  <p className="text-[var(--muted-foreground)]">Ngày tạo: {new Date(job.createdAt).toLocaleDateString("vi-VN")}</p>
                  <button
                    type="button"
                    onClick={() => router.push(`?tab=applications&jobId=${job.id}`)}
                    className="rounded-full bg-[var(--brand)]/10 px-3 py-1 font-medium text-[var(--brand)] hover:bg-[var(--brand)]/15"
                    title="Xem danh sách ứng tuyển"
                  >
                    Ứng tuyển: {job._count?.applications ?? 0}
                  </button>
                </div>
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
      <PhotoProvider maskOpacity={0.8}>
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
          {/* Cover Section */}
          <div className="relative h-72 w-full bg-gradient-to-br from-[var(--brand)]/15 via-transparent to-transparent">
            {company.coverUrl ? (
              <PhotoView src={company.coverUrl}>
                <Image
                  src={company.coverUrl}
                  alt={company.name}
                  fill
                  priority
                  quality={100}
                  unoptimized
                  className="cursor-zoom-in object-cover"
                />
              </PhotoView>
            ) : null}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
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
                <PhotoView src={company.logoUrl}>
                  <Image
                    src={company.logoUrl}
                    alt={company.name}
                    width={192}
                    height={192}
                    quality={100}
                    unoptimized
                    className="h-24 w-24 cursor-zoom-in rounded-2xl border-4 border-white/80 bg-white object-cover shadow-xl"
                  />
                </PhotoView>
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
            <h1 className="text-2xl font-semibold">
              {company.legalName ? (
                <>
                  {company.legalName} <span className="font-normal opacity-90">({company.name})</span>
                </>
              ) : (
                company.name
              )}
            </h1>
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
            <button
              type="button"
              className="text-2xl font-semibold text-[var(--foreground)] underline decoration-dotted underline-offset-4 hover:text-[var(--brand)]"
              onClick={() => setFollowersOpen(true)}
              title="Xem danh sách người theo dõi"
            >
              {company.stats?.followers ?? 0}
            </button>
          </div>
        </div>
      </div>
      </PhotoProvider>

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
          {followersOpen ? (
            <CompanyFollowersModal
              isOpen={followersOpen}
              onClose={() => setFollowersOpen(false)}
              companyId={companyId}
            />
          ) : null}
          {editJobId ? (
            <EditJobModal
              isOpen={Boolean(editJobId)}
              onClose={() => setEditJobId(null)}
              jobId={editJobId ?? ""}
              onSaved={async () => {
                await jobsQuery.refetch();
                setEditJobId(null);
              }}
            />
          ) : null}
          {createJobOpen ? (
            <CreateJobModal
              isOpen={createJobOpen}
              onClose={() => setCreateJobOpen(false)}
              companyId={companyId}
              onCreated={async () => {
                await jobsQuery.refetch();
                setCreateJobOpen(false);
              }}
            />
          ) : null}
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
              legalName: company.legalName,
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
