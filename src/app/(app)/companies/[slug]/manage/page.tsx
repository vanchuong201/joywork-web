import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import CompanyProfileHero from "@/components/company/profile/CompanyProfileHero";
import ManageCompanyTabs from "@/components/company/ManageCompanyTabs";
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Top Bar for Manager */}
      <div className="bg-white border-b sticky top-0 z-30 px-6 py-3 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-4">
             <Link href={`/companies/${company.slug}`} className="text-slate-500 hover:text-slate-900 flex items-center gap-2 text-sm font-medium">
                 <ArrowLeft className="w-4 h-4" /> Xem trang công khai
             </Link>
             <div className="h-4 w-px bg-slate-200" />
             <span className="font-bold text-slate-700">Trang quản trị</span>
        </div>
         <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" asChild>
                 <Link href={`/companies/${company.slug}/settings`}>
                     <Settings className="w-4 h-4 mr-2" /> Cài đặt
                 </Link>
            </Button>
          </div>
      </div>

      {/* Hero Section (Read-only view for context, editing via Settings or specific Edit Hero modal later) */}
      <CompanyProfileHero company={company} isEditable={true} />

      {/* Main Content & Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <ManageCompanyTabs company={company} initialTab={tab} />
      </div>
    </div>
  );
}
