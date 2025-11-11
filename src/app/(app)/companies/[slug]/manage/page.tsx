"use client";

import { useParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuth";
import { useMemo, useState, useCallback, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import EmptyState from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import CompanyPostComposer from "@/components/company/PostComposer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import CompanyProfileForm from "@/components/company/CompanyProfileForm";
import CompanyMetricsEditor from "@/components/company/CompanyMetricsEditor";
import CompanyStoryEditor from "@/components/company/CompanyStoryEditor";
import JobComposer from "@/components/company/JobComposer";
import { toast } from "sonner";
import { type CompanyMetric, type CompanyStoryBlock, type CompanyHighlight } from "@/types/company";

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

type PostTypeOption = "STORY" | "ANNOUNCEMENT" | "EVENT";
type PostVisibilityOption = "PUBLIC" | "PRIVATE";

const POST_TYPES: PostTypeOption[] = ["STORY", "ANNOUNCEMENT", "EVENT"];
const POST_VISIBILITIES: PostVisibilityOption[] = ["PUBLIC", "PRIVATE"];

export default function ManageCompanyPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params?.slug[0] : (params?.slug as string | undefined);
  const memberships = useAuthStore((s) => s.memberships);

  const membership = useMemo(
    () => memberships.find((m) => m.company.slug === slug),
    [memberships, slug]
  );

  const hasAccess = membership && ["OWNER", "ADMIN"].includes(membership.role);

  const companyQuery = useQuery({
    queryKey: ["company-manage", slug],
    enabled: Boolean(slug) && Boolean(hasAccess),
    queryFn: async () => {
      const res = await api.get(`/api/companies/${slug}`);
      return res.data.data.company as CompanyManageResponse;
    },
  });

  const companyId = companyQuery.data?.id;

  const queryClient = useQueryClient();
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postDraft, setPostDraft] = useState<{
    title: string;
    content: string;
    type: PostTypeOption;
    visibility: PostVisibilityOption;
  }>({
    title: "",
    content: "",
    type: "STORY",
    visibility: "PUBLIC",
  });
  const [postSavingId, setPostSavingId] = useState<string | null>(null);
  const [postToggleId, setPostToggleId] = useState<string | null>(null);
  const [postDeleteId, setPostDeleteId] = useState<string | null>(null);
  const [jobToggleId, setJobToggleId] = useState<string | null>(null);
  const [jobDeleteId, setJobDeleteId] = useState<string | null>(null);

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

  const updatePostMutation = useMutation({
    mutationFn: async ({
      postId,
      title,
      content,
      type,
      visibility,
    }: {
      postId: string;
      title: string;
      content: string;
      type: PostTypeOption;
      visibility: PostVisibilityOption;
    }) => {
      const res = await api.patch(`/api/posts/${postId}`, {
        title: title.trim(),
        content: content.trim(),
        type,
        visibility,
      });
      return res.data.data.post as PostItem;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật bài viết");
      setEditingPostId(null);
      void postsQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Cập nhật bài viết thất bại";
      toast.error(message);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ postId, published }: { postId: string; published: boolean }) => {
      if (published) {
        await api.post(`/api/posts/${postId}/unpublish`);
      } else {
        await api.post(`/api/posts/${postId}/publish`);
      }
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.published ? "Đã chuyển bài về nháp" : "Bài viết đã được công khai");
      void postsQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Không thể thay đổi trạng thái bài viết";
      toast.error(message);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      await api.delete(`/api/posts/${postId}`);
    },
    onSuccess: () => {
      toast.success("Đã xoá bài viết");
      void postsQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Xoá bài viết thất bại";
      toast.error(message);
    },
  });

  const toggleJobMutation = useMutation({
    mutationFn: async ({ jobId, nextActive }: { jobId: string; nextActive: boolean }) => {
      await api.patch(`/api/jobs/${jobId}`, { isActive: nextActive });
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.nextActive ? "Job đã mở" : "Đã đóng job");
      void jobsQuery.refetch();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Không thể cập nhật trạng thái job";
      toast.error(message);
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async ({ jobId }: { jobId: string }) => {
      await api.delete(`/api/jobs/${jobId}`);
    },
    onSuccess: () => {
      toast.success("Đã xoá job");
      void jobsQuery.refetch();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message ?? "Xoá job thất bại";
      toast.error(message);
    },
  });

  const startEditingPost = useCallback((post: PostItem) => {
    setEditingPostId(post.id);
    setPostDraft({
      title: post.title,
      content: post.content,
      type: POST_TYPES.includes(post.type as PostTypeOption)
        ? (post.type as PostTypeOption)
        : "STORY",
      visibility: POST_VISIBILITIES.includes(post.visibility as PostVisibilityOption)
        ? (post.visibility as PostVisibilityOption)
        : "PUBLIC",
    });
  }, []);

  const cancelEditingPost = useCallback(() => {
    setEditingPostId(null);
  }, []);

  const savePost = useCallback(async () => {
    if (!editingPostId) return;
    setPostSavingId(editingPostId);
    try {
      await updatePostMutation.mutateAsync({
        postId: editingPostId,
        title: postDraft.title,
        content: postDraft.content,
        type: postDraft.type,
        visibility: postDraft.visibility,
      });
    } finally {
      setPostSavingId(null);
    }
  }, [editingPostId, postDraft, updatePostMutation]);

  const handleDeletePost = useCallback(
    (post: PostItem) => {
      if (!window.confirm("Bạn chắc chắn muốn xoá bài viết này?")) return;
      setPostDeleteId(post.id);
      deletePostMutation.mutate(
        { postId: post.id },
        {
          onSettled: () => setPostDeleteId(null),
        },
      );
    },
    [deletePostMutation],
  );

  const handleTogglePublish = useCallback(
    (post: PostItem) => {
      setPostToggleId(post.id);
      togglePublishMutation.mutate(
        { postId: post.id, published: Boolean(post.publishedAt) },
        {
          onSettled: () => setPostToggleId(null),
        },
      );
    },
    [togglePublishMutation],
  );

  const handleToggleJob = useCallback(
    (job: JobItem) => {
      setJobToggleId(job.id);
      toggleJobMutation.mutate(
        { jobId: job.id, nextActive: !job.isActive },
        {
          onSettled: () => setJobToggleId(null),
        },
      );
    },
    [toggleJobMutation],
  );

  const handleDeleteJob = useCallback(
    (job: JobItem) => {
      if (!window.confirm("Xoá job này? Hành động này không thể hoàn tác.")) return;
      setJobDeleteId(job.id);
      deleteJobMutation.mutate(
        { jobId: job.id },
        {
          onSettled: () => setJobDeleteId(null),
        },
      );
    },
    [deleteJobMutation],
  );

  if (!slug) {
    return (
      <EmptyState title="Không tìm thấy công ty" subtitle="Slug không hợp lệ." />
    );
  }

  if (!hasAccess) {
    return (
      <EmptyState
        title="Bạn không có quyền truy cập"
        subtitle="Quyền quản trị chỉ dành cho Owner hoặc Admin của công ty."
      />
    );
  }

  if (companyQuery.isLoading || !companyQuery.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const company = companyQuery.data;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        {company.coverUrl ? (
          <div className="h-40 w-full overflow-hidden">
            <img src={company.coverUrl} alt={company.name} className="h-full w-full object-cover" />
          </div>
        ) : null}
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-4">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.name} className="h-16 w-16 rounded-md object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-md bg-[var(--muted)] text-lg font-semibold text-[var(--muted-foreground)]">
                {company.name.slice(0, 1)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">{company.name}</h1>
              <p className="text-sm text-[var(--muted-foreground)]">{company.tagline ?? "Chưa có tagline"}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--muted-foreground)]">
                {company.industry && <span>Ngành: {company.industry}</span>}
                {company.location && <span>Địa điểm: {company.location}</span>}
                {company.size && <span>Quy mô: {company.size}</span>}
                {company.foundedYear && <span>Thành lập: {company.foundedYear}</span>}
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-[var(--muted-foreground)]">
            <p>Quyền quản trị dành cho Owner & Admin.</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Bài viết" value={company.stats?.posts ?? 0} />
          <MetricCard label="Việc làm" value={company.stats?.jobs ?? 0} />
          <MetricCard label="Người theo dõi" value={company.stats?.followers ?? 0} />
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="stories">Stories</TabsTrigger>
          <TabsTrigger value="jobs">Việc làm</TabsTrigger>
          <TabsTrigger value="applications">Ứng tuyển</TabsTrigger>
          <TabsTrigger value="members">Thành viên</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.5fr_minmax(0,1fr)]">
              <Card>
                <CardHeader className="pb-2">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Hồ sơ doanh nghiệp</h3>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Cập nhật thông tin giúp trang profile của bạn hấp dẫn và đồng nhất trên toàn hệ thống.
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <CompanyProfileForm
                    companyId={company.id}
                    initialData={{
                      name: company.name,
                      tagline: company.tagline ?? "",
                      description: company.description ?? "",
                      website: company.website ?? "",
                      location: company.location ?? "",
                      industry: company.industry ?? "",
                      size: company.size ?? "",
                      foundedYear: company.foundedYear ?? null,
                      headcount: company.headcount ?? null,
                      headcountNote: company.headcountNote ?? "",
                      logoUrl: company.logoUrl ?? "",
                      coverUrl: company.coverUrl ?? "",
                    }}
                    onSuccess={() => {
                      void companyQuery.refetch();
                    }}
                  />
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                {company.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={company.coverUrl} alt={company.name} className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-[var(--muted)] text-sm text-[var(--muted-foreground)]">
                    Thêm ảnh cover để trang công ty trông sống động hơn
                  </div>
                )}
                <CardContent className="space-y-3 pt-4 text-sm text-[var(--muted-foreground)]">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{company.name}</p>
                    <p>{company.tagline ?? "Chưa có tagline"}</p>
                  </div>
                  <div className="grid gap-2">
                    <InfoRow label="Ngành" value={company.industry ?? "Chưa cập nhật"} />
                    <InfoRow label="Địa điểm" value={company.location ?? "Chưa cập nhật"} />
                    <InfoRow
                      label="Quy mô"
                      value={
                        company.headcount
                          ? `${company.headcount.toLocaleString("vi-VN")} nhân sự`
                          : company.size ?? "Chưa cập nhật"
                      }
                    />
                    {company.headcountNote ? (
                      <InfoRow label="Ghi chú quy mô" value={company.headcountNote} />
                    ) : null}
                    <InfoRow
                      label="Thành lập"
                      value={company.foundedYear ? String(company.foundedYear) : "Chưa cập nhật"}
                    />
                    <InfoRow
                      label="Website"
                      value={
                        company.website ? (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--brand)] hover:underline"
                          >
                            {company.website}
                          </a>
                        ) : (
                          "Chưa cập nhật"
                        )
                      }
                    />
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/companies/${company.slug}`} target="_blank">
                      Xem trang công ty
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <CompanyMetricsEditor companyId={company.id} initialMetrics={company.metrics} />
            <CompanyStoryEditor companyId={company.id} initialStory={company.profileStory} />
          </div>
        </TabsContent>

        <TabsContent value="stories">
          <div className="space-y-4">
            {companyId ? (
              <CompanyPostComposer companyId={companyId} onCreated={() => postsQuery.refetch()} />
            ) : null}
            <ItemList
              isLoading={postsQuery.isLoading}
              items={postsQuery.data}
              emptyMessage="Chưa có story nào. Hãy chia sẻ câu chuyện mới của công ty."
              renderItem={(post) => (
                <Card key={post.id}>
                  <CardHeader className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                        <span className="rounded-full bg-[var(--muted)] px-2 py-1 text-[var(--foreground)]">
                          {post.type}
                        </span>
                        <span>• {post.visibility === "PUBLIC" ? "Công khai" : "Riêng tư"}</span>
                      </div>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {post.publishedAt
                          ? `Xuất bản: ${new Date(post.publishedAt).toLocaleString()}`
                          : `Tạo lúc: ${new Date(post.createdAt).toLocaleString()}`}
                      </span>
                    </div>
                    {editingPostId !== post.id ? (
                      <h3 className="text-base font-semibold text-[var(--foreground)]">{post.title}</h3>
                    ) : null}
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    {editingPostId === post.id ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[var(--foreground)]">Tiêu đề</label>
                          <Input
                            value={postDraft.title}
                            onChange={(e) =>
                              setPostDraft((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-[var(--foreground)]">Nội dung</label>
                          <Textarea
                            rows={4}
                            value={postDraft.content}
                            onChange={(e) =>
                              setPostDraft((prev) => ({
                                ...prev,
                                content: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--foreground)]">Loại bài</label>
                            <select
                              value={postDraft.type}
                              onChange={(e) =>
                                setPostDraft((prev) => ({
                                  ...prev,
                                  type: e.target.value as PostTypeOption,
                                }))
                              }
                              className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                            >
                              {POST_TYPES.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--foreground)]">Hiển thị</label>
                            <select
                              value={postDraft.visibility}
                              onChange={(e) =>
                                setPostDraft((prev) => ({
                                  ...prev,
                                  visibility: e.target.value as PostVisibilityOption,
                                }))
                              }
                              className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--input)] px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                            >
                              {POST_VISIBILITIES.map((option) => (
                                <option key={option} value={option}>
                                  {option === "PUBLIC" ? "Công khai" : "Riêng tư"}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={cancelEditingPost}
                            disabled={postSavingId === post.id}
                          >
                            Huỷ
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void savePost()}
                            disabled={
                              postSavingId === post.id ||
                              !postDraft.title.trim() ||
                              !postDraft.content.trim()
                            }
                          >
                            {postSavingId === post.id ? "Đang lưu..." : "Lưu thay đổi"}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap leading-relaxed text-[var(--muted-foreground)]">
                          {post.content}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
                          <span>{post.publishedAt ? "Đang hiển thị trên trang công ty" : "Chưa xuất bản"}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditingPost(post)}
                          >
                            Chỉnh sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePublish(post)}
                            disabled={postToggleId === post.id}
                          >
                            {postToggleId === post.id
                              ? "Đang xử lý..."
                              : post.publishedAt
                              ? "Ẩn bài"
                              : "Đăng ngay"}
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/posts/${post.id}`} target="_blank">
                              Xem
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDeletePost(post)}
                            disabled={postDeleteId === post.id}
                          >
                            {postDeleteId === post.id ? "Đang xoá..." : "Xoá"}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="jobs">
          <div className="space-y-4">
            {companyId ? (
              <JobComposer companyId={companyId} onCreated={() => jobsQuery.refetch()} />
            ) : null}
            <ItemList
              isLoading={jobsQuery.isLoading}
              items={jobsQuery.data}
              emptyMessage="Chưa có job nào. Tạo job mới để thu hút ứng viên."
              renderItem={(job) => (
                <Card key={job.id}>
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--foreground)]">{job.title}</h3>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {job.remote ? "Remote" : job.location ?? "Không ghi rõ"} • {job.employmentType} • {job.experienceLevel}
                      </p>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {new Date(job.createdAt).toLocaleString()} • {job.isActive ? "Đang mở" : "Đã đóng"}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
                    <p className="line-clamp-3 whitespace-pre-wrap leading-relaxed">
                      {job.description ?? "Chưa cập nhật mô tả chi tiết cho job này."}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {(job.salaryMin || job.salaryMax) && (
                        <span className="rounded-md bg-[var(--muted)] px-2 py-1 text-[var(--foreground)]">
                          Lương: {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
                        </span>
                      )}
                      <span className="rounded-md bg-[var(--muted)] px-2 py-1 text-[var(--foreground)]">
                        Trạng thái: {job.isActive ? "Đang mở" : "Đã đóng"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleJob(job)}
                        disabled={jobToggleId === job.id}
                      >
                        {jobToggleId === job.id
                          ? "Đang cập nhật..."
                          : job.isActive
                          ? "Đóng job"
                          : "Mở job"}
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/jobs/${job.id}`} target="_blank">
                          Xem job
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleDeleteJob(job)}
                        disabled={jobDeleteId === job.id}
                      >
                        {jobDeleteId === job.id ? "Đang xoá..." : "Xoá"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            />
          </div>
        </TabsContent>

        <TabsContent value="applications">
          <ItemList
            isLoading={applicationsQuery.isLoading}
            items={applicationsQuery.data}
            emptyMessage="Chưa có hồ sơ ứng tuyển nào."
            renderItem={(application) => (
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
            )}
          />
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardContent className="divide-y divide-[var(--border)] p-0">
              {company.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{member.user.name ?? member.user.email}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{member.user.email}</p>
                  </div>
                  <div className="text-xs uppercase text-[var(--muted-foreground)]">{member.role}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="font-medium text-[var(--foreground)]">{label}</span>
      <span className="text-right text-[var(--muted-foreground)]">{value}</span>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs uppercase text-[var(--muted-foreground)]">{label}</p>
      <p className="text-2xl font-semibold text-[var(--foreground)]">{value.toLocaleString()}</p>
    </div>
  );
}

function ItemList<T>({
  isLoading,
  items,
  emptyMessage,
  renderItem,
}: {
  isLoading: boolean;
  items?: T[];
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Card key={idx}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return <EmptyState title="Chưa có dữ liệu" subtitle={emptyMessage} />;
  }

  return <div className="space-y-3">{items.map(renderItem)}</div>;
}

function formatSalaryRange(min?: number | null, max?: number | null, currency?: string) {
  if (!min && !max) return "Thoả thuận";
  const formatter = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
  const unit = currency ?? "VND";
  if (min && max) return `${formatter.format(min)} - ${formatter.format(max)} ${unit}`;
  if (min) return `${formatter.format(min)} ${unit}`;
  return `${formatter.format(max!)} ${unit}`;
}


