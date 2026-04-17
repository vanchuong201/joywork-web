"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";
import { buildJobUrl } from "@/lib/job-url";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Plus, Users, Eye, List, Grid, Edit, MoreVertical, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
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

  const refreshJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await api.patch(`/api/jobs/${jobId}/refresh`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["company-jobs-manage", company.id] });
      toast.success("Đã làm mới tin tuyển dụng");
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error?.message ?? "Không thể làm mới tin tuyển dụng");
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

  const handleRefreshJob = (jobId: string) => {
    refreshJobMutation.mutate(jobId);
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">Quản lý tin tuyển dụng</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Tổng cộng {totalJobs} tin tuyển dụng ({activeJobsCount} đang mở)
            {totalPages > 1 && ` • Trang ${currentPage}/${totalPages}`}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 lg:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={cn("h-8 px-3 text-xs", statusFilter === "all" && "bg-[var(--muted)] font-medium text-[var(--foreground)]")}
            >
              Tất cả
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("active")}
              className={cn("h-8 px-3 text-xs", statusFilter === "active" && "bg-emerald-50 text-emerald-700 font-medium")}
            >
              Đang mở
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter("inactive")}
              className={cn(
                "h-8 px-3 text-xs",
                statusFilter === "inactive" && "bg-[var(--muted)] text-[var(--muted-foreground)] font-medium"
              )}
            >
              Đã đóng
            </Button>
          </div>
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn("h-8 px-3", viewMode === "list" && "bg-[var(--muted)]")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn("h-8 px-3", viewMode === "grid" && "bg-[var(--muted)]")}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={() => setCreateJobOpen(true)} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> Đăng tin mới
          </Button>
        </div>
      </div>

      {/* Jobs List/Grid */}
      {jobsQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-32 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--card)]" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="border-2 border-dashed border-[var(--border)] bg-[var(--card)]">
          <div className="py-12 text-center text-[var(--muted-foreground)]">
            <p className="mb-4 text-lg font-medium text-[var(--foreground)]">Chưa có tin tuyển dụng nào</p>
            <Button variant="secondary" onClick={() => setCreateJobOpen(true)}>
              Đăng tin ngay
            </Button>
          </div>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-4">
          {jobs.map((job: any) => (
            <Card key={job.id} className="border-[var(--border)] bg-[var(--card)] transition-colors hover:border-[var(--brand)]/50">
              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="mb-2 truncate text-base font-semibold text-[var(--foreground)] sm:text-lg">{job.title}</h4>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
                          <span>Cập nhật ngày: {formatDate(job.updatedAt || job.createdAt)}</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {job._count?.applications ?? 0} ứng viên
                          </span>
                        </div>
                      </div>
                      {/* Status Toggle - Improved UI */}
                      <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/60 px-3 py-2">
                        <div className="flex flex-col items-end gap-1">
                          <span className={cn("text-xs font-medium", job.isActive ? "text-emerald-700" : "text-[var(--muted-foreground)]")}>
                            {job.isActive ? "Đang tuyển" : "Đã đóng"}
                          </span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">
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
                  <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewApplicants(job.id)}
                      className="flex flex-1 items-center gap-2 lg:flex-none"
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
                          <div className="absolute right-0 top-10 z-20 min-w-48 rounded-md border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg">
                            <button
                              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                              onClick={() => {
                                window.open(buildJobUrl(job), "_blank", "noopener,noreferrer");
                                setOpenMenuId(null);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              Xem công khai
                            </button>
                            <button
                              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                              onClick={() => {
                                setEditingJob(job);
                                setOpenMenuId(null);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              Chỉnh sửa
                            </button>
                            {job.isActive && (
                              <button
                                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                                onClick={() => handleRefreshJob(job.id)}
                              >
                                <RotateCcw className="h-4 w-4" />
                                Làm mới
                              </button>
                            )}
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
            <Card key={job.id} className="border-[var(--border)] bg-[var(--card)] transition-colors hover:border-[var(--brand)]/50">
              <div className="space-y-4 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="line-clamp-2 flex-1 text-base font-semibold text-[var(--foreground)] sm:text-lg">{job.title}</h4>
                </div>
                <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{job._count?.applications ?? 0} ứng viên</span>
                  </div>
                  <div>Cập nhật ngày: {formatDate(job.updatedAt || job.createdAt)}</div>
                </div>
                {/* Status Toggle - Improved UI */}
                <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className={cn("text-xs font-medium", job.isActive ? "text-emerald-700" : "text-[var(--muted-foreground)]")}>
                        {job.isActive ? "Đang tuyển" : "Đã đóng"}
                      </span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">
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
                <div className="flex flex-col gap-2 border-t border-[var(--border)] pt-2">
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
                        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-md border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg">
                          <button
                            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                            onClick={() => {
                              window.open(buildJobUrl(job), "_blank", "noopener,noreferrer");
                              setOpenMenuId(null);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Xem công khai
                          </button>
                          <button
                            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                            onClick={() => {
                              setEditingJob(job);
                              setOpenMenuId(null);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            Chỉnh sửa
                          </button>
                          {job.isActive && (
                            <button
                              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]"
                              onClick={() => handleRefreshJob(job.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                              Làm mới
                            </button>
                          )}
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
        <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[var(--muted-foreground)]">
            Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalJobs)} trong tổng số {totalJobs} tin
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
