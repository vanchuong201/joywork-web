import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import CompanyActivityFeed from "@/components/company/CompanyActivityFeed";
import CompanyProfileHero from "@/components/company/profile/CompanyProfileHero";
import CompanyProfileContent from "@/components/company/profile/CompanyProfileContent";
import CompanyJobsTab from "@/components/company/CompanyJobsTab";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function getCompany(slug: string) {
  const res = await fetch(`${API_BASE_URL}/api/companies/${slug}`, {
    cache: "no-store",
    next: { tags: [`company-${slug}`] },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error("Failed to fetch company");
  }

  return res.json().then((r) => r.data.company);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) return {};

  return {
    title: `${company.name} | JoyWork`,
    description: company.tagline || company.description,
    openGraph: {
      title: company.name,
      description: company.tagline || company.description,
      images: company.coverUrl ? [company.coverUrl] : company.logoUrl ? [company.logoUrl] : [],
    },
  };
}

export default async function CompanyPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();

  const { tab: searchTab } = await searchParams;
  const tab = searchTab || "overview";
  const isOverview = tab === "overview";
  const isActivity = tab === "activity";
  const isJobs = tab === "jobs";

  // Data fetching based on tab to optimize performance
  // Activity Feed
  let posts = [];
  let postsPagination = null;
  if (isActivity) {
    try {
        const res = await fetch(
            `${API_BASE_URL}/api/posts?companyId=${company.id}&page=1&limit=10`,
            { cache: "no-store", next: { revalidate: 0 } },
        );
        if (res.ok) {
            const data = await res.json();
            posts = data.data.posts;
            postsPagination = data.data.pagination;
        }
    } catch (e) {
        console.error("Error fetching posts", e);
    }
  }

  // Jobs
  let jobs = [];
  if (isJobs) {
    try {
        const res = await fetch(
            `${API_BASE_URL}/api/jobs?companyId=${company.id}&page=1&limit=20&isActive=true`,
            { cache: "no-store" }
        );
        if (res.ok) {
            jobs = (await res.json()).data.jobs;
        }
    } catch (e) {
        console.error("Error fetching jobs", e);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] font-sans selection:bg-[var(--brand-light)] selection:text-[var(--brand-dark)] pb-20">
      
      {/* Hero Section */}
      <CompanyProfileHero company={company} />

      {/* Main Content & Tabs */}
      <div className="mx-auto max-w-7xl -mx-4 px-2 sm:mx-auto sm:px-6">
        <div className="-mx-2 sticky top-[6.5rem] z-20 mb-5 rounded-xl border border-[var(--border)] bg-[var(--card)]/95 p-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/80 sm:mx-0 sm:mb-8 sm:p-2">
          <nav className="flex w-full items-center gap-1 overflow-x-auto sm:gap-2" aria-label="Điều hướng hồ sơ công ty">
            <Link
              href={`/companies/${company.slug}?tab=overview`}
              scroll={false}
              className={`inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-all ${
                isOverview
                  ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Hồ sơ
            </Link>
            <Link
              href={`/companies/${company.slug}?tab=activity`}
              scroll={false}
              className={`inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-all ${
                isActivity
                  ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Hoạt động
            </Link>
            <Link
              href={`/companies/${company.slug}?tab=jobs`}
              scroll={false}
              className={`inline-flex h-9 items-center justify-center whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-all ${
                isJobs
                  ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Tuyển dụng
            </Link>
          </nav>
          {/* <p className="px-1 pt-1 text-[11px] text-[var(--muted-foreground)] md:hidden">Vuốt ngang để xem thêm mục</p> */}
        </div>

        {isOverview && <CompanyProfileContent company={company} />}

        {isActivity && (
          <div className="mx-auto max-w-3xl">
            {posts.length > 0 ? (
              <CompanyActivityFeed
                posts={posts}
                companyId={company.id}
                totalPages={postsPagination?.totalPages}
              />
            ) : (
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] py-14 text-center shadow-sm sm:py-20">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-[var(--foreground)]">Chưa có hoạt động nào</h3>
                <p className="text-[var(--muted-foreground)]">Công ty chưa đăng tải bài viết nào gần đây.</p>
              </div>
            )}
          </div>
        )}

        {isJobs && (
          <CompanyJobsTab
            jobs={jobs}
            companyName={company.name}
            companyLogoUrl={company.logoUrl}
          />
        )}
      </div>
    </div>
  );
}
