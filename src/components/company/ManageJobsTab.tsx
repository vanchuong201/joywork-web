"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Plus, Users, Eye, List, Grid, Edit, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import CreateJobModal from "./CreateJobModal";
import EditJobModal from "./EditJobModal";
import { Company } from "@/types/company";
import { cn } from "@/lib/utils";

type Props = {
  company: Company;
};

type ViewMode = "list" | "grid";
type StatusFilter = "all" | "active" | "inactive";

export default function ManageJobsTab({ company }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch Jobs with pagination
  const jobsQuery = useQuery({
    queryKey: ["company-jobs-manage", company.id, currentPage, statusFilter],
    queryFn: async () => {
      const params: any = {
        companyId: company.id,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };
      // Add status filter if not "all"
      if (statusFilter === "active") {
        params.isActive = true;
      } else if (statusFilter === "inactive") {
        params.isActive = false;
      }
      const res = await api.get("/api/jobs", { params });
      return res.data.data;
    },
    // Disable auto-refetch to prevent flickering when toggling status
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // Keep data fresh for 5 minutes, but don't auto-refetch on mount/focus
    staleTime: 5 * 60 * 1000,
  });

  // Toggle job status mutation with optimistic update
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ jobId, isActive, oldIsActive }: { jobId: string; isActive: boolean; oldIsActive: boolean }) => {
      await api.patch(`/api/jobs/${jobId}`, { isActive });
      return { jobId, isActive, oldIsActive };
    },
    // Optimistic update: update cache immediately before API call
    onMutate: async ({ jobId, isActive, oldIsActive }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await qc.cancelQueries({ queryKey: ["company-jobs-manage", company.id, currentPage, statusFilter] });
      
      // Snapshot the previous value for rollback
      const previousData = qc.getQueryData(["company-jobs-manage", company.id, currentPage, statusFilter]);
      
      // Optimistically update cache immediately
      qc.setQueryData(
        ["company-jobs-manage", company.id, currentPage, statusFilter],
        (oldData: any) => {
          if (!oldData) return oldData;
          // Check if the job's new status matches the current filter
          const shouldShowJob = 
            statusFilter === "all" || 
            (statusFilter === "active" && isActive) || 
            (statusFilter === "inactive" && !isActive);
          
          if (shouldShowJob) {
            // Update the job in place - keep same object reference for other jobs to prevent re-render
            const jobIndex = oldData.jobs.findIndex((job: any) => job.id === jobId);
            if (jobIndex === -1) return oldData;
            
            // Check if job actually needs update (avoid unnecessary object creation)
            if (oldData.jobs[jobIndex].isActive === isActive) return oldData;
            
            // Only create new array and update the specific job
            const updatedJobs = [...oldData.jobs];
            updatedJobs[jobIndex] = { ...updatedJobs[jobIndex], isActive };
            
            // Keep pagination reference if unchanged
            return {
              ...oldData,
              jobs: updatedJobs,
              // Keep pagination object reference to prevent re-render
              pagination: oldData.pagination,
            };
          } else {
            // Remove the job from the current page if it doesn't match the filter
            return {
              ...oldData,
              jobs: oldData.jobs.filter((job: any) => job.id !== jobId),
              // Keep pagination object reference
              pagination: oldData.pagination,
            };
          }
        }
      );
      
      // Optimistically update active count
      qc.setQueryData(
        ["company-jobs-active-count", company.id],
        (oldCount: number | undefined) => {
          const currentCount = oldCount ?? activeJobsCount;
          if (oldIsActive && !isActive) {
            return Math.max(0, currentCount - 1);
          } else if (!oldIsActive && isActive) {
            return currentCount + 1;
          }
          return currentCount;
        }
      );
      
      // Return context with previous data for rollback
      return { previousData };
    },
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      // Cache already updated in onMutate, no need to update again
    },
    onError: (e: any, variables, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        qc.setQueryData(
          ["company-jobs-manage", company.id, currentPage, statusFilter],
          context.previousData
        );
      }
      toast.error(e?.response?.data?.error?.message ?? "Không thể cập nhật trạng thái");
    },
  });

  const handleToggleStatus = useCallback((job: any) => {
    const oldIsActive = job.isActive;
    setTogglingJobId(job.id); // Track which job is being toggled
    toggleStatusMutation.mutate(
      { 
        jobId: job.id, 
        isActive: !job.isActive,
        oldIsActive 
      },
      {
        onSettled: () => {
          // Clear toggling state after mutation completes (success or error)
          setTogglingJobId(null);
        },
      }
    );
    setOpenMenuId(null); // Close menu after action
  }, [toggleStatusMutation]);

  const handleViewApplicants = (jobId: string) => {
    router.push(`${pathname}?tab=applications&jobId=${jobId}`);
    setOpenMenuId(null);
  };

  // Memoize jobs array to prevent unnecessary re-renders
  // Only recreate if jobs array reference actually changes
  const jobs = useMemo(() => {
    const jobsData = jobsQuery.data?.jobs || [];
    return jobsData;
  }, [jobsQuery.data?.jobs]);
  const pagination = jobsQuery.data?.pagination || { page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 1 };
  const totalPages = pagination.totalPages;
  const totalJobs = pagination.total;
  
  // Count active jobs - we need to fetch all jobs for this count, or use a separate query
  // For now, we'll estimate based on current page or fetch separately
  const activeJobsCountQuery = useQuery({
    queryKey: ["company-jobs-active-count", company.id],
    queryFn: async () => {
      const res = await api.get("/api/jobs", { params: { companyId: company.id, isActive: true, limit: 1 } });
      return res.data.data.pagination.total;
    },
    enabled: !!company.id,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  const activeJobsCount = activeJobsCountQuery.data || 0;
  
  // Track which job is currently being toggled to disable only that switch
  const [togglingJobId, setTogglingJobId] = useState<string | null>(null);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Quản lý tin tuyển dụng</h3>
          <p className="text-sm text-slate-500 mt-1">
            Tổng cộng {totalJobs} tin tuyển dụng ({activeJobsCount} đang mở)
            {totalPages > 1 && ` • Trang ${currentPage}/${totalPages}`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-white">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={cn("h-8 px-3 text-xs", statusFilter === "all" && "bg-slate-100 font-medium")}
            >
              Tất cả
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("active")}
              className={cn("h-8 px-3 text-xs", statusFilter === "active" && "bg-green-50 text-green-700 font-medium")}
            >
              Đang mở
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("inactive")}
              className={cn("h-8 px-3 text-xs", statusFilter === "inactive" && "bg-slate-100 text-slate-600 font-medium")}
            >
              Đã đóng
            </Button>
          </div>
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1 bg-white">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn("h-8 px-3", viewMode === "list" && "bg-slate-100")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn("h-8 px-3", viewMode === "grid" && "bg-slate-100")}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => setCreateJobOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Đăng tin mới
          </Button>
        </div>
      </div>

      {/* Jobs List/Grid */}
      {jobsQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200">
          <div className="text-center py-12 text-slate-500">
            <p className="mb-4 text-lg font-medium">Chưa có tin tuyển dụng nào</p>
            <Button variant="secondary" onClick={() => setCreateJobOpen(true)}>
              Đăng tin ngay
            </Button>
          </div>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-4">
          {jobs.map((job: any) => (
            <Card key={job.id} className="hover:border-[var(--brand)]/50 transition-colors">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg mb-2 text-slate-900 truncate">{job.title}</h4>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-500 items-center">
                          <span>Đăng ngày: {formatDate(job.createdAt)}</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {job._count?.applications ?? 0} ứng viên
                          </span>
                        </div>
                      </div>
                      {/* Status Toggle - Improved UI */}
                      <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-2 border border-slate-200">
                        <div className="flex flex-col items-end gap-1">
                          <span className={cn("text-xs font-medium", job.isActive ? "text-green-700" : "text-slate-500")}>
                            {job.isActive ? "Đang tuyển" : "Đã đóng"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {job.isActive ? "Ứng viên có thể xem và ứng tuyển" : "Đã ẩn khỏi tìm kiếm"}
                          </span>
                        </div>
                        <Switch
                          checked={job.isActive}
                          onCheckedChange={() => handleToggleStatus(job)}
                          disabled={togglingJobId === job.id}
                          className="flex-shrink-0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewApplicants(job.id)}
                      className="flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Ứng viên ({job._count?.applications ?? 0})
                    </Button>
                    {/* Actions Dropdown */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                        className="h-9 w-9 p-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      {openMenuId === job.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-10 z-20 min-w-48 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                            <button
                              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                              onClick={() => {
                                window.open(`/jobs/${job.id}`, "_blank", "noopener,noreferrer");
                                setOpenMenuId(null);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              Xem công khai
                            </button>
                            <button
                              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                              onClick={() => {
                                setEditingJob(job);
                                setOpenMenuId(null);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              Chỉnh sửa
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job: any) => (
            <Card key={job.id} className="hover:border-[var(--brand)]/50 transition-colors">
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-lg text-slate-900 line-clamp-2 flex-1">{job.title}</h4>
                </div>
                <div className="space-y-2 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{job._count?.applications ?? 0} ứng viên</span>
                  </div>
                  <div>Đăng ngày: {formatDate(job.createdAt)}</div>
                </div>
                {/* Status Toggle - Improved UI */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className={cn("text-xs font-medium", job.isActive ? "text-green-700" : "text-slate-500")}>
                        {job.isActive ? "Đang tuyển" : "Đã đóng"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {job.isActive ? "Ứng viên có thể xem và ứng tuyển" : "Đã ẩn khỏi tìm kiếm"}
                      </span>
                    </div>
                    <Switch
                      checked={job.isActive}
                      onCheckedChange={() => handleToggleStatus(job)}
                      disabled={togglingJobId === job.id}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewApplicants(job.id)}
                    className="w-full"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Xem ứng viên ({job._count?.applications ?? 0})
                  </Button>
                  {/* Actions Dropdown */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                      className="w-full"
                    >
                      <MoreVertical className="w-4 h-4 mr-2" />
                      Thao tác
                    </Button>
                    {openMenuId === job.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
                          <button
                            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                            onClick={() => {
                              window.open(`/jobs/${job.id}`, "_blank", "noopener,noreferrer");
                              setOpenMenuId(null);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Xem công khai
                          </button>
                          <button
                            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                            onClick={() => {
                              setEditingJob(job);
                              setOpenMenuId(null);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            Chỉnh sửa
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalJobs)} trong tổng số {totalJobs} tin
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Trước
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-9"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateJobModal
        open={createJobOpen}
        onOpenChange={setCreateJobOpen}
        companyId={company.id}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["company-jobs-manage", company.id] });
          setCurrentPage(1); // Reset to first page after creating new job
        }}
      />

      {editingJob && (
        <EditJobModal
          open={!!editingJob}
          onOpenChange={(open) => !open && setEditingJob(null)}
          job={editingJob}
          onSuccess={() => {
            setEditingJob(null);
            qc.invalidateQueries({ queryKey: ["company-jobs-manage", company.id] });
          }}
        />
      )}

    </div>
  );
}
