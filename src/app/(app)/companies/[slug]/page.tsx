import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Briefcase, Calendar, MessageCircle } from "lucide-react";
import CompanyActivityFeed from "@/components/company/CompanyActivityFeed";
import CompanyProfileHero from "@/components/company/profile/CompanyProfileHero";
import CompanyProfileContent from "@/components/company/profile/CompanyProfileContent";
import { formatDate } from "@/lib/utils";

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

  // Data fetching based on tab to optimize performance
  // Activity Feed
  let posts = [];
  let postsPagination = null;
  if (tab === "activity") {
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
  if (tab === "jobs") {
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

  // Members (People)
  let members = [];
  if (tab === "people") {
      members = company.members || [];
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      
      {/* Hero Section */}
      <CompanyProfileHero company={company} />

      {/* Main Content & Tabs */}
      <div className="max-w-7xl mx-auto px-6">
        <Tabs defaultValue={tab} className="w-full">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 border-b border-slate-200">
                <TabsList className="bg-transparent h-auto p-0 gap-8 w-full md:w-auto overflow-x-auto flex-nowrap justify-start">
                    <Link href={`/companies/${company.slug}?tab=overview`} scroll={false}>
                        <TabsTrigger 
                            value="overview" 
                            className="data-[state=active]:text-blue-600 data-[state=active]:border-b-4 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-slate-500 font-bold text-lg px-2 py-4 rounded-none transition-all hover:text-slate-900 shadow-none"
                        >
                            Hồ sơ công ty
                        </TabsTrigger>
                    </Link>
                    <Link href={`/companies/${company.slug}?tab=activity`} scroll={false}>
                        <TabsTrigger 
                            value="activity" 
                            className="data-[state=active]:text-blue-600 data-[state=active]:border-b-4 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-slate-500 font-bold text-lg px-2 py-4 rounded-none transition-all hover:text-slate-900 shadow-none"
                        >
                            Hoạt động
                        </TabsTrigger>
                    </Link>
                    <Link href={`/companies/${company.slug}?tab=jobs`} scroll={false}>
                        <TabsTrigger 
                            value="jobs" 
                            className="data-[state=active]:text-blue-600 data-[state=active]:border-b-4 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-slate-500 font-bold text-lg px-2 py-4 rounded-none transition-all hover:text-slate-900 shadow-none"
                        >
                            Tuyển dụng <span className="ml-2 bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{company.stats?.jobs || 0}</span>
                        </TabsTrigger>
                    </Link>
                    <Link href={`/companies/${company.slug}?tab=people`} scroll={false}>
                        <TabsTrigger 
                            value="people" 
                            className="data-[state=active]:text-blue-600 data-[state=active]:border-b-4 data-[state=active]:border-blue-600 data-[state=active]:bg-transparent text-slate-500 font-bold text-lg px-2 py-4 rounded-none transition-all hover:text-slate-900 shadow-none"
                        >
                            Con người
                        </TabsTrigger>
                    </Link>
                </TabsList>
                
                {/* Right side actions (optional) */}
                <div className="hidden md:flex items-center gap-3">
                    {/* Could add Share button or similar here */}
                </div>
            </div>

            {/* TAB: OVERVIEW (PROFILE) */}
            <TabsContent value="overview" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <CompanyProfileContent company={company} />
            </TabsContent>

            {/* TAB: ACTIVITY */}
            <TabsContent value="activity" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <div className="max-w-3xl mx-auto">
                    {posts.length > 0 ? (
                        <CompanyActivityFeed 
                            posts={posts} 
                            companyId={company.id} 
                            totalPages={postsPagination?.totalPages} 
                        />
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <MessageCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có hoạt động nào</h3>
                            <p className="text-slate-500">Công ty chưa đăng tải bài viết nào gần đây.</p>
                        </div>
                    )}
                </div>
            </TabsContent>

            {/* TAB: JOBS */}
            <TabsContent value="jobs" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                 <div className="grid gap-6">
                    {jobs.length > 0 ? (
                        jobs.map((job: any) => (
                            <Link href={`/jobs/${job.id}`} key={job.id} className="block group">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">{job.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location || "Remote"}</span>
                                                <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.employmentType}</span>
                                                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(job.createdAt)}</span>
                                            </div>
                                        </div>
                                        {company.logoUrl && (
                                            <div className="w-12 h-12 relative bg-white rounded-lg border border-slate-100 p-1">
                                                <Image src={company.logoUrl} alt={company.name} fill className="object-contain p-1" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        {job.skills?.slice(0, 3).map((skill: string) => (
                                            <Badge key={skill} className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 font-normal">
                                                {skill}
                                            </Badge>
                                        ))}
                                        {job.skills?.length > 3 && (
                                            <Badge className="bg-slate-50 text-slate-500 border-0 font-normal">
                                                +{job.skills.length - 3}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Briefcase className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có vị trí tuyển dụng</h3>
                            <p className="text-slate-500">Hiện tại công ty chưa đăng tuyển vị trí nào.</p>
                        </div>
                    )}
                 </div>
            </TabsContent>

            {/* TAB: PEOPLE */}
            <TabsContent value="people" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {members.length > 0 ? (
                        members.map((member: any) => (
                            <div key={member.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                                <div className="w-16 h-16 relative rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                                    {member.user.avatar ? (
                                        <Image src={member.user.avatar} alt={member.user.name || "Member"} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xl">
                                            {(member.user.name || member.user.email).charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{member.user.name || "Thành viên ẩn danh"}</h4>
                                    <p className="text-sm text-slate-500 mb-1">{member.role === 'OWNER' ? 'Founder / Owner' : member.role}</p>
                                    <p className="text-xs text-slate-400 truncate max-w-[180px]">{member.user.email}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Users className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Chưa có thành viên công khai</h3>
                            <p className="text-slate-500">Danh sách thành viên đang được cập nhật.</p>
                        </div>
                    )}
                 </div>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
