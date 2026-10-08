import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CompanyHiddenError, fetchCompanyBySlug, redirectIfCompanySlugChanged } from "@/lib/server-company";
import CompanyHiddenNotice from "@/components/company/CompanyHiddenNotice";
import CompanyApplicationDetailClient from "./CompanyApplicationDetailClient";

type Props = {
  params: Promise<{ slug: string; applicationId: string }>;
};

export default async function CompanyApplicationDetailPage({ params }: Props) {
  const { slug, applicationId } = await params;
  let company: { slug?: string } | null = null;

  try {
    company = await fetchCompanyBySlug(slug, (await headers()).get("cookie") || "");
  } catch (error) {
    if (error instanceof CompanyHiddenError) {
      return <CompanyHiddenNotice />;
    }
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Không thể tải dữ liệu doanh nghiệp</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Không kết nối được tới máy chủ API. Vui lòng kiểm tra backend và thử tải lại trang.
          </p>
        </div>
      </div>
    );
  }

  if (!company?.slug) notFound();

  redirectIfCompanySlugChanged(
    slug,
    company.slug,
    `/manage/applications/${encodeURIComponent(applicationId)}`,
  );

  return <CompanyApplicationDetailClient slug={company.slug} applicationId={applicationId} />;
}
