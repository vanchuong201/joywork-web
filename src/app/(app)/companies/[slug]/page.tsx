import CompanyManageButton from "@/components/company/CompanyManageButton";
import CompanyStoryRenderer from "@/components/company/CompanyStoryRenderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import Link from "next/link";
import { CompanyProfile } from "@/types/company";

type CompanyResponse = {
  data: {
    company: CompanyProfile;
  };
};

type PostsResponse = {
  data: {
    posts: Array<{
      id: string;
      title: string;
      content: string;
      type: string;
      publishedAt?: string | null;
      createdAt: string;
      images?: Array<{ id: string; url: string }>;
    }>;
  };
};

type JobsResponse = {
  data: {
    jobs: Array<{
      id: string;
      title: string;
      description: string;
      employmentType: string;
      experienceLevel: string;
      location?: string | null;
      remote: boolean;
      salaryMin?: number | null;
      salaryMax?: number | null;
      currency: string;
      applicationDeadline?: string | null;
      isActive: boolean;
      createdAt: string;
    }>;
  };
};

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

  const companyRes = await fetch(`${baseURL}/api/companies/${slug}`, {
    cache: "no-store",
    next: { revalidate: 0 },
  });

  if (!companyRes.ok) {
    return (
      <div className="mx-auto max-w-[1080px] space-y-6 p-4">
        <EmptyState
          title="Không tìm thấy công ty"
          subtitle="Có thể công ty đã bị xoá hoặc đang ở chế độ riêng tư."
        />
      </div>
    );
  }

  const companyPayload = (await companyRes.json()) as CompanyResponse;
  const company = companyPayload.data.company;

  const postsPromise = fetch(
    `${baseURL}/api/posts?companyId=${company.id}&page=1&limit=5`,
    { cache: "no-store", next: { revalidate: 0 } },
  )
    .then(async (res): Promise<PostsResponse> => {
      if (!res.ok) {
        return { data: { posts: [] } };
      }
      return (await res.json()) as PostsResponse;
    })
    .catch(() => ({ data: { posts: [] } }));

  const jobsPromise = fetch(
    `${baseURL}/api/jobs?companyId=${company.id}&page=1&limit=8`,
    { cache: "no-store", next: { revalidate: 0 } },
  )
    .then(async (res): Promise<JobsResponse> => {
      if (!res.ok) {
        return { data: { jobs: [] } };
      }
      return (await res.json()) as JobsResponse;
    })
    .catch(() => ({ data: { jobs: [] } }));

  const [{ data: postsData }, { data: jobsData }] = await Promise.all([
    postsPromise,
    jobsPromise,
  ]);

  return (
    <div className="mx-auto max-w-[1080px] space-y-6 p-4">
      <CompanyHero company={company} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="activity">Hoạt động</TabsTrigger>
          <TabsTrigger value="jobs">Việc làm</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CompanyStoryRenderer blocks={company.profileStory} fallbackDescription={company.description} />
        </TabsContent>

        <TabsContent value="activity">
          {postsData.posts.length === 0 ? (
            <EmptyState
              title="Chưa có bài viết công khai"
              subtitle="Khi doanh nghiệp đăng bài, nội dung sẽ hiển thị tại đây."
            />
          ) : (
            <div className="space-y-4">
              {postsData.posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
                      <span className="rounded-full bg-[var(--muted)] px-3 py-1 uppercase text-[var(--foreground)]">
                        {post.type}
                      </span>
                      <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-[var(--foreground)]">{post.title}</h3>
                      <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                        {createExcerpt(post.content)}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/posts/${post.id}`}>Đọc chi tiết</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="jobs">
          {jobsData.jobs.length === 0 ? (
            <EmptyState
              title="Hiện chưa có job đang mở"
              subtitle="Khi doanh nghiệp mở job mới, bạn sẽ thấy tại đây."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {jobsData.jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
                      <span>
                        {job.remote ? "Remote" : job.location ?? "Không ghi rõ"} · {job.employmentType} ·{" "}
                        {job.experienceLevel}
                      </span>
                      <span>{formatDate(job.createdAt)}</span>
                    </div>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-base font-semibold text-[var(--foreground)] hover:text-[var(--brand)]"
                    >
                      {job.title}
                    </Link>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-[var(--muted-foreground)]">
                    <p className="line-clamp-3 leading-relaxed">{createExcerpt(job.description, 260)}</p>
                    <div className="text-xs">
                      <p>Lương: {formatSalary(job.salaryMin, job.salaryMax, job.currency)}</p>
                      {job.applicationDeadline ? (
                        <p>Hạn nộp: {formatDate(job.applicationDeadline)}</p>
                      ) : null}
                    </div>
                    <Button asChild size="sm">
                      <Link href={`/jobs/${job.id}`}>Xem chi tiết job</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CompanyHero({ company }: { company: CompanyProfile }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
      <div className="relative h-56 w-full bg-gradient-to-br from-[var(--brand)]/15 via-transparent to-transparent">
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
        <div className="absolute bottom-5 left-6 flex flex-wrap items-end gap-4">
          <CompanyAvatar company={company} />
          <div className="space-y-2 text-white drop-shadow">
            <h1 className="text-2xl font-semibold">{company.name}</h1>
            {company.tagline ? (
              <p className="text-sm text-white/85">{company.tagline}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 p-6">
        <CompanyMetadata company={company} />
        <CompanyActions company={company} />
      </div>

    </div>
  );
}

function CompanyAvatar({ company }: { company: CompanyProfile }) {
  if (company.logoUrl) {
    return (
      <Image
        src={company.logoUrl}
        alt={company.name}
        width={96}
        height={96}
        className="h-24 w-24 rounded-2xl border-4 border-white/80 bg-white object-cover shadow-xl"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white/80 bg-white text-3xl font-semibold text-[var(--muted-foreground)] shadow-xl">
      {company.name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function CompanyMetadata({ company }: { company: CompanyProfile }) {
  const tags = [
    company.industry ? `Ngành: ${company.industry}` : null,
    company.location ? `Trụ sở: ${company.location}` : null,
    company.size ? `Quy mô: ${translateCompanySize(company.size)}` : null,
    company.foundedYear ? `Thành lập: ${company.foundedYear}` : null,
  ].filter(Boolean) as string[];

  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
      {tags.map((tag, idx) => (
        <span key={idx} className="rounded-full bg-[var(--muted)] px-3 py-1 text-[var(--foreground)]">
          {tag}
        </span>
      ))}
    </div>
  );
}

function CompanyActions({ company }: { company: CompanyProfile }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {company.website ? (
        <Button asChild variant="outline" size="sm">
          <Link href={company.website} target="_blank" rel="noreferrer">
            🌐 Website
          </Link>
        </Button>
      ) : null}
      <Button variant="outline" size="sm">
        ❤️ Theo dõi{typeof company.stats?.followers === "number" ? ` (${company.stats.followers})` : ""}
      </Button>
      <Button variant="outline" size="sm">
        💬 Nhắn tin / Liên hệ
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href={`/jobs?companyId=${company.id}`}>💼 Việc làm</Link>
      </Button>
      <CompanyManageButton slug={company.slug} />
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

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN").format(value ?? 0);
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatSalary(min?: number | null, max?: number | null, currency?: string) {
  if (!min && !max) return "Thoả thuận";
  const unit = currency ?? "VND";
  const fmt = (value: number) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);
  if (min && max) return `${fmt(min)} - ${fmt(max)} ${unit}`;
  if (min) return `${fmt(min)} ${unit}`;
  return `${fmt(max!)} ${unit}`;
}

function createExcerpt(content: string, maxLength = 200) {
  if (!content) return "";
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}…`;
}
