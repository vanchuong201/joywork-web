import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Users, Briefcase, FileText, LayoutDashboard, Pencil } from "lucide-react";
import CompanyProfileHero from "@/components/company/profile/CompanyProfileHero";
import CompanyProfileContent from "@/components/company/profile/CompanyProfileContent";
import ManageCompanyPageContent from "@/components/company/ManageCompanyPageContent"; 
import { getServerSession } from "@/lib/auth"; // Assume
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
      <CompanyProfileHero company={company} />

      {/* Main Content & Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <Tabs defaultValue={tab} className="w-full">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-16 z-20 rounded-xl px-4 shadow-sm">
                <TabsList className="bg-transparent h-auto p-0 gap-6 w-full md:w-auto overflow-x-auto flex-nowrap justify-start py-2">
                    <Link href={`/companies/${company.slug}/manage?tab=overview`} scroll={false}>
                        <TabsTrigger 
                            value="overview" 
                            className="data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50/50 text-slate-500 font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-slate-900 shadow-none flex items-center gap-2"
                        >
                            <LayoutDashboard className="w-4 h-4" /> Hồ sơ (Edit)
                        </TabsTrigger>
                    </Link>
                    <Link href={`/companies/${company.slug}/manage?tab=activity`} scroll={false}>
                        <TabsTrigger 
                            value="activity" 
                            className="data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50/50 text-slate-500 font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-slate-900 shadow-none flex items-center gap-2"
                        >
                            <FileText className="w-4 h-4" /> Hoạt động
                        </TabsTrigger>
                    </Link>
                    <Link href={`/companies/${company.slug}/manage?tab=jobs`} scroll={false}>
                        <TabsTrigger 
                            value="jobs" 
                            className="data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50/50 text-slate-500 font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-slate-900 shadow-none flex items-center gap-2"
                        >
                            <Briefcase className="w-4 h-4" /> Tuyển dụng
                        </TabsTrigger>
                    </Link>
                    <Link href={`/companies/${company.slug}/manage?tab=applications`} scroll={false}>
                        <TabsTrigger 
                            value="applications" 
                            className="data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50/50 text-slate-500 font-bold text-base px-4 py-3 rounded-lg transition-all hover:text-slate-900 shadow-none flex items-center gap-2"
                        >
                            <Users className="w-4 h-4" /> Ứng viên
                        </TabsTrigger>
                          </Link>
                </TabsList>
    </div>

            {/* TAB: OVERVIEW (Editable Profile) */}
            <TabsContent value="overview" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-center gap-3 text-blue-800">
                    <div className="bg-blue-100 p-2 rounded-full"><Pencil className="w-4 h-4" /></div>
                    <p className="text-sm font-medium">Bạn đang ở chế độ chỉnh sửa. Di chuột vào các mục để chỉnh sửa nội dung.</p>
                </div>
                <CompanyProfileContent company={company} isEditable={true} />
            </TabsContent>

            {/* Reuse existing ManageCompanyPageContent for complex logic of other tabs */}
            <div className={tab === "overview" ? "hidden" : "block"}>
                <ManageCompanyPageContent company={company} />
        </div>

        </Tabs>
      </div>
    </div>
  );
}
