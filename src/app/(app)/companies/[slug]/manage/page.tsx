import { Metadata } from "next";
import { notFound } from "next/navigation";
import ManageCompanyPageClient from "./ManageCompanyPageClient";
import { headers } from "next/headers";
import { fetchCompanyBySlug, redirectIfCompanySlugChanged } from "@/lib/server-company";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let company: any = null;
  try {
    company = await fetchCompanyBySlug(slug);
  } catch {
    return {};
  }
  if (!company) return {};
  return {
    title: `Quản lý - ${company.name} | JOYWORK`,
  };
}

export default async function ManageCompanyPage({ params, searchParams }: Props) {
  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";
  
  const { slug } = await params;
  let company: any = null;
  try {
    company = await fetchCompanyBySlug(slug, cookie);
  } catch {
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
  
  if (!company) notFound();

  const resolvedSearchParams = await searchParams;
  redirectIfCompanySlugChanged(slug, company.slug, "/manage", resolvedSearchParams);

  const tab = resolvedSearchParams.tab || "overview";

  return <ManageCompanyPageClient company={company} tab={tab} />;
}
