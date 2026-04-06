import { Metadata } from "next";
import { notFound } from "next/navigation";
import ManageCompanyPageClient from "./ManageCompanyPageClient";
import { headers } from "next/headers";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const API_BASE_CANDIDATES = Array.from(
  new Set(
    [
      process.env.INTERNAL_API_BASE_URL,
      API_BASE_URL,
      "http://localhost:4000",
      "http://127.0.0.1:4000",
    ].filter(Boolean)
  )
) as string[];

async function getCompany(slug: string, cookie?: string) {
  let sawNotFound = false;
  let lastError: unknown = null;

  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      const res = await fetch(`${baseUrl}/api/companies/${slug}`, {
        cache: "no-store",
        headers: cookie ? { Cookie: cookie } : undefined,
      });

      if (res.ok) {
        const payload = await res.json();
        return payload?.data?.company ?? null;
      }

      if (res.status === 404) {
        sawNotFound = true;
        continue;
      }

      lastError = new Error(`Failed to fetch company: ${res.status}`);
    } catch (error) {
      lastError = error;
    }
  }

  if (sawNotFound) return null;
  throw lastError instanceof Error ? lastError : new Error("Failed to fetch company");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let company: any = null;
  try {
    company = await getCompany(slug);
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
    company = await getCompany(slug, cookie);
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

  // Basic permission check (should be handled by middleware/backend ideally, but good for UX)
  // Assuming the user can access this page if the API call succeeded (API usually checks permission)
  // However, we need to know current user role. 
  // For now, if getCompany succeeds with auth cookie, we assume access.

  const { tab: searchTab } = await searchParams;
  const tab = searchTab || "overview";

  return <ManageCompanyPageClient company={company} tab={tab} />;
}
