"use client";

import { useSearchParams } from "next/navigation";
import { Company } from "@/types/company";
import PostComposer from "./PostComposer";
import CompanyActivityFeed from "./CompanyActivityFeed";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { useState } from "react";
import CreateJobModal from "./CreateJobModal";
import EditJobModal from "./EditJobModal";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function ManageCompanyPageContent({ company }: { company: Company }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);

  // Fetch Jobs
  const jobsQuery = useQuery({
      queryKey: ["company-jobs-manage", company.id],
      queryFn: async () => {
          const res = await api.get("/api/jobs", { params: { companyId: company.id, limit: 50 } });
          return res.data.data.jobs;
      },
      enabled: tab === "jobs"
  });

  if (tab === "overview") return null;

  return (
    <div className="py-8">
        {/* Tab: Activity */}
        {tab === "activity" && (
            <div className="max-w-3xl mx-auto space-y-8">
                <PostComposer companyId={company.id} userAvatar={null} />
                <div className="mt-8">
                    <h3 className="text-xl font-bold mb-4 text-slate-800">Bài viết đã đăng</h3>
                    {/* Pass empty array, component will fetch data */}
                    <CompanyActivityFeed posts={[]} companyId={company.id} /> 
                </div>
            </div>
        )}

        {/* Tab: Jobs */}
        {tab === "jobs" && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Quản lý tin tuyển dụng</h3>
                    <Button onClick={() => setCreateJobOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4 mr-2" /> Đăng tin mới
                    </Button>
                </div>

                <div className="grid gap-4">
                    {jobsQuery.data?.map((job: any) => (
                        <div key={job.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-300 transition-colors">
                            <div>
                                <h4 className="font-bold text-lg mb-1 text-slate-900">{job.title}</h4>
                                <div className="flex flex-wrap gap-3 text-sm text-slate-500 items-center">
                                    <Badge variant={job.isActive ? "default" : "secondary"} className={job.isActive ? "bg-green-500 hover:bg-green-600" : ""}>
                                        {job.isActive ? "Đang tuyển" : "Đã đóng"}
                                    </Badge>
                                    <span>Đăng ngày: {formatDate(job.createdAt)}</span>
                                    {/* Placeholder for application count if API doesn't return it yet */}
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" /> {job.applicationsCount ?? 0} ứng viên
                                    </span>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setEditingJob(job)}>Chỉnh sửa</Button>
                        </div>
                    ))}
                    {jobsQuery.data?.length === 0 && (
                        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 rounded-xl">
                            <p className="mb-4">Chưa có tin tuyển dụng nào</p>
                            <Button variant="secondary" onClick={() => setCreateJobOpen(true)}>Đăng tin ngay</Button>
                        </div>
                    )}
                </div>
                
                <CreateJobModal 
                    open={createJobOpen} 
                    onOpenChange={setCreateJobOpen} 
                    companyId={company.id} 
                    onSuccess={() => jobsQuery.refetch()}
                />
                
                {editingJob && (
                    <EditJobModal
                        open={!!editingJob}
                        onOpenChange={(open) => !open && setEditingJob(null)}
                        job={editingJob}
                        onSuccess={() => {
                            setEditingJob(null);
                            jobsQuery.refetch();
                        }}
                    />
                )}
            </div>
        )}

        {/* Tab: Applications */}
        {tab === "applications" && (
            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800">Danh sách ứng viên</h3>
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-slate-300" />
                    </div>
                    <h4 className="font-bold text-lg text-slate-700 mb-2">Tính năng đang phát triển</h4>
                    <p>Giao diện quản lý ứng viên dạng Kanban Board đang được cập nhật.</p>
                </div>
            </div>
        )}
    </div>
  );
}

