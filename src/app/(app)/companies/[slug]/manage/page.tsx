import { Metadata } from "next";
import { notFound } from "next/navigation";
import ManageCompanyPageClient from "./ManageCompanyPageClient";
import { headers } from "next/headers";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function getCompany(slug: string, cookie?: string) {
  const res = await fetch(`${API_BASE_URL}/api/companies/${slug}`, {
    cache: "no-store",
    headers: cookie ? { Cookie: cookie } : undefined,
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
    title: `Quản lý - ${company.name} | JoyWork`,
  };
}

export default async function ManageCompanyPage({ params, searchParams }: Props) {
  const headersList = await headers();
  const cookie = headersList.get("cookie") || "";
  
  const { slug } = await params;
  const company = await getCompany(slug, cookie);
  
  if (!company) notFound();

  // Basic permission check (should be handled by middleware/backend ideally, but good for UX)
  // Assuming the user can access this page if the API call succeeded (API usually checks permission)
  // However, we need to know current user role. 
  // For now, if getCompany succeeds with auth cookie, we assume access.

  const { tab: searchTab } = await searchParams;
  const tab = searchTab || "overview";

  return <ManageCompanyPageClient company={company} tab={tab} />;
}
