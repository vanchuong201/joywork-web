"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { buildJobUrl } from "@/lib/job-url";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users, User, FileText, ExternalLink, ChevronLeft, ChevronRight, X, MoreVertical, Edit, List, Grid } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Company } from "@/types/company";

type Props = {
  company: Company;
};

type ViewMode = "list" | "grid";
type StatusFilter = "all" | "RECEIVED" | "SUITABLE" | "INTERVIEW_SCHEDULED" | "OFFER_SENT" | "HIRED" | "NOT_SUITABLE";

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: "Tiếp nhận",
  SUITABLE: "Phù hợp",
  INTERVIEW_SCHEDULED: "Hẹn phỏng vấn",
  OFFER_SENT: "Gửi đề nghị",
  HIRED: "Nhận việc",
  NOT_SUITABLE: "Chưa phù hợp",
};

const STATUS_COLORS: Record<string, string> = {
  RECEIVED: "bg-yellow-100 text-yellow-700 border-yellow-200",
  SUITABLE: "bg-blue-100 text-blue-700 border-blue-200",
  INTERVIEW_SCHEDULED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  OFFER_SENT: "bg-green-100 text-green-700 border-green-200",
  HIRED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  NOT_SUITABLE: "bg-red-100 text-red-700 border-red-200",
};

const ITEMS_PER_PAGE = 10;

export default function ManageApplicationsTab({ company }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  
  const jobId = searchParams.get("jobId") || undefined;
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Fetch Jobs for filter dropdown
  const jobsQuery = useQuery({
    queryKey: ["company-jobs-for-applications", company.id],
    queryFn: async () => {
      const res = await api.get("/api/jobs", { params: { companyId: company.id, limit: 50 } });
      return res.data.data.jobs;
    },
  });

  // Fetch Applications
  const applicationsQuery = useQuery({
    queryKey: ["company-applications", company.id, jobId, statusFilter, currentPage],
    queryFn: async () => {
      const params: any = {
        companyId: company.id,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      };
      if (jobId) params.jobId = jobId;
      if (statusFilter !== "all") params.status = statusFilter;
      
      const res = await api.get("/api/jobs/applications", { params });
      return res.data.data;
    },
    enabled: true,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status, notes }: { applicationId: string; status: string; notes?: string }) => {
      await api.patch(`/api/jobs/applications/${applicationId}/status`, { status, notes });
    },
    onSuccess: () => {
      toast.success("Đã cập nhật trạng thái");
      applicationsQuery.refetch();
      setStatusDialogOpen(false);
      setSelectedApplication(null);
      setNewStatus("");
      setNotes("");
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.error?.message ?? "Không thể cập nhật trạng thái");
    },
  });

  const handleStatusChange = (application: any) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setNotes(application.notes || "");
    setStatusDialogOpen(true);
  };

  const handleUpdateStatus = () => {
    if (!selectedApplication || !newStatus) return;
    updateStatusMutation.mutate({
      applicationId: selectedApplication.id,
      status: newStatus,
      notes: notes || undefined,
    });
  };

  const handleJobFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("jobId");
    } else {
      params.set("jobId", value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, jobId]);

  const applications = applicationsQuery.data?.applications || [];
  const pagination = applicationsQuery.data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  const selectedJob = jobId ? jobsQuery.data?.find((j: any) => j.id === jobId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--foreground)] sm:text-xl">Danh sách ứng viên</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {pagination ? (
              <>
                Tổng cộng {pagination.total} ứng viên
                {totalPages > 1 && ` • Trang ${currentPage}/${totalPages}`}
              </>
            ) : (
              "Đang tải..."
            )}
          </p>
        </div>
        {/* View Mode Toggle */}
        <div className="flex w-full items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 sm:w-auto">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 flex-1 px-3 sm:flex-none"
          >
            <List className="w-4 h-4 mr-2" />
            Danh sách
          </Button>
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="h-8 flex-1 px-3 sm:flex-none"
          >
            <Grid className="w-4 h-4 mr-2" />
            Lưới
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Job Filter */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
            <Label htmlFor="job-filter" className="shrink-0 whitespace-nowrap text-sm font-medium text-[var(--foreground)]">
              Vị trí:
            </Label>
            <select
              id="job-filter"
              value={jobId || "all"}
              onChange={(e) => handleJobFilterChange(e.target.value)}
              className="h-9 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] transition-colors focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 sm:w-[250px]"
            >
              <option value="all">Tất cả vị trí</option>
              {jobsQuery.data?.map((job: any) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial">
            <Label htmlFor="status-filter" className="shrink-0 whitespace-nowrap text-sm font-medium text-[var(--foreground)]">
              Trạng thái:
            </Label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-9 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm text-[var(--foreground)] transition-colors focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20 sm:w-[180px]"
            >
              <option value="all">Tất cả</option>
              <option value="RECEIVED">Tiếp nhận</option>
              <option value="SUITABLE">Phù hợp</option>
              <option value="INTERVIEW_SCHEDULED">Hẹn phỏng vấn</option>
              <option value="OFFER_SENT">Gửi đề nghị</option>
              <option value="HIRED">Nhận việc</option>
              <option value="NOT_SUITABLE">Chưa phù hợp</option>
            </select>
          </div>

          {/* Clear filters */}
          {(jobId || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete("jobId");
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
                setStatusFilter("all");
              }}
              className="text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <X className="w-4 h-4 mr-1.5" />
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </Card>

      {/* Selected Job Info */}
      {selectedJob && (
        <Card className="border-blue-200 bg-blue-50/80">
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-600 font-medium mb-1">Đang lọc theo vị trí:</p>
              <p className="text-sm font-semibold text-blue-900 truncate">{selectedJob.title}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleJobFilterChange("all")}
              className="h-8 w-8 text-blue-600 hover:text-blue-900 hover:bg-blue-100 shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Applications List */}
      {applicationsQuery.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="border-[var(--border)] bg-[var(--card)] p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 animate-pulse rounded-full bg-[var(--muted)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--muted)]" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-[var(--muted)]" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card className="border-2 border-dashed border-[var(--border)] bg-[var(--card)]">
          <div className="py-12 text-center text-[var(--muted-foreground)]">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--muted)]">
              <Users className="h-8 w-8 text-[var(--muted-foreground)]" />
            </div>
            <p className="mb-4 text-lg font-medium text-[var(--foreground)]">
              {jobId || statusFilter !== "all"
                ? "Không tìm thấy ứng viên phù hợp"
                : "Chưa có ứng viên nào"}
            </p>
            <p className="text-sm">
              {jobId || statusFilter !== "all"
                ? "Thử điều chỉnh bộ lọc để xem thêm kết quả"
                : "Ứng viên sẽ xuất hiện ở đây khi họ ứng tuyển vào các vị trí của công ty"}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {viewMode === "list" ? (
            <div className="space-y-4">
              {applications.map((application: any) => {
                const user = application.user;
                const profile = user?.profile;
                const avatar = profile?.avatar || user?.avatar;
                const userName = user?.name || user?.email || "Ứng viên";
                const headline = profile?.headline;

                return (
                  <Card key={application.id} className="border-[var(--border)] bg-[var(--card)] transition-all hover:shadow-md">
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        {/* User Avatar */}
                        <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2 border-[var(--border)] bg-[var(--muted)]">
                          {avatar ? (
                            <Image
                              src={avatar}
                              alt={userName}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[var(--muted)] text-[var(--muted-foreground)]">
                              <User className="w-7 h-7" />
                            </div>
                          )}
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <Link
                                  href={`/profile/${user?.slug || user?.id}`}
                                  className="text-base font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--brand)]"
                                >
                                  {userName}
                                </Link>
                                <Badge 
                                  className={cn("border px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[application.status] || "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]")}
                                >
                                  {STATUS_LABEL[application.status] || application.status}
                                </Badge>
                              </div>
                              {headline && (
                                <p className="line-clamp-1 text-sm text-[var(--muted-foreground)]">{headline}</p>
                              )}
                            </div>

                            {/* Actions Dropdown */}
                            <DropdownMenu.Root>
                              <DropdownMenu.Trigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenu.Trigger>
                              <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                  align="end"
                                  className="z-50 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg"
                                  sideOffset={5}
                                >
                                  <DropdownMenu.Item
                                    onClick={() => handleStatusChange(application)}
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors outline-none hover:bg-[var(--muted)]"
                                  >
                                    <Edit className="w-4 h-4" />
                                    Cập nhật trạng thái
                                  </DropdownMenu.Item>
                                  <DropdownMenu.Item asChild>
                                    <Link 
                                      href={`/profile/${user?.slug || user?.id}`} 
                                      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors outline-none hover:bg-[var(--muted)]"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      Xem hồ sơ
                                    </Link>
                                  </DropdownMenu.Item>
                                  {profile?.cvUrl && (
                                    <DropdownMenu.Item asChild>
                                      <a 
                                        href={profile.cvUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors outline-none hover:bg-[var(--muted)]"
                                      >
                                        <FileText className="w-4 h-4" />
                                        Xem CV
                                      </a>
                                    </DropdownMenu.Item>
                                  )}
                                </DropdownMenu.Content>
                              </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                          </div>

                          {/* Application Details */}
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                              <span className="font-medium text-[var(--muted-foreground)]">Vị trí:</span>
                              <Link
                                href={buildJobUrl(application.job)}
                                target="_blank"
                                className="text-[var(--brand)] hover:underline font-medium"
                              >
                                {application.job.title}
                              </Link>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
                              <span className="font-medium text-[var(--muted-foreground)]">Ứng tuyển:</span>
                              <span>{formatDate(application.appliedAt)}</span>
                            </div>
                            {application.coverLetter && (
                              <div className="border-t border-[var(--border)] pt-2">
                                <p className="mb-1 text-xs font-medium text-[var(--muted-foreground)]">Thư giới thiệu:</p>
                                <p className="line-clamp-2 text-sm leading-relaxed text-[var(--muted-foreground)]">{application.coverLetter}</p>
                              </div>
                            )}
                            {application.notes && (
                              <div className="border-t border-[var(--border)] pt-2">
                                <p className="mb-1 text-xs font-medium text-[var(--muted-foreground)]">Phản hồi của doanh nghiệp:</p>
                                <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{application.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {applications.map((application: any) => {
                const user = application.user;
                const profile = user?.profile;
                const avatar = profile?.avatar || user?.avatar;
                const userName = user?.name || user?.email || "Ứng viên";
                const headline = profile?.headline;

                return (
                  <Card key={application.id} className="flex flex-col border-[var(--border)] bg-[var(--card)] transition-all hover:shadow-lg">
                    <div className="flex h-full flex-col p-4 sm:p-5">
                      {/* Header with Avatar and Actions */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-[var(--border)] bg-[var(--muted)]">
                          {avatar ? (
                            <Image
                              src={avatar}
                              alt={userName}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[var(--muted)] text-[var(--muted-foreground)]">
                              <User className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              align="end"
                              className="z-50 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--card)] p-1 shadow-lg"
                              sideOffset={5}
                            >
                              <DropdownMenu.Item
                                onClick={() => handleStatusChange(application)}
                                className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors outline-none hover:bg-[var(--muted)]"
                              >
                                <Edit className="w-4 h-4" />
                                Cập nhật trạng thái
                              </DropdownMenu.Item>
                              <DropdownMenu.Item asChild>
                                <Link 
                                  href={`/profile/${user?.slug || user?.id}`} 
                                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors outline-none hover:bg-[var(--muted)]"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Xem hồ sơ
                                </Link>
                              </DropdownMenu.Item>
                              {profile?.cvUrl && (
                                <DropdownMenu.Item asChild>
                                  <a 
                                    href={profile.cvUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors outline-none hover:bg-[var(--muted)]"
                                  >
                                    <FileText className="w-4 h-4" />
                                    Xem CV
                                  </a>
                                </DropdownMenu.Item>
                              )}
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </div>

                      {/* Name and Status */}
                      <div className="mb-3">
                        <Link
                          href={`/profile/${user?.slug || user?.id}`}
                          className="mb-2 block text-base font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--brand)]"
                        >
                          {userName}
                        </Link>
                        {headline && (
                          <p className="mb-2 line-clamp-2 text-xs text-[var(--muted-foreground)]">{headline}</p>
                        )}
                        <Badge 
                          className={cn("border px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[application.status] || "border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]")}
                        >
                          {STATUS_LABEL[application.status] || application.status}
                        </Badge>
                      </div>

                      {/* Application Details */}
                      <div className="flex-1 space-y-2 text-sm">
                        <div className="text-[var(--muted-foreground)]">
                          <span className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Vị trí:</span>
                          <Link
                            href={buildJobUrl(application.job)}
                            target="_blank"
                            className="text-[var(--brand)] hover:underline font-medium text-sm line-clamp-1"
                          >
                            {application.job.title}
                          </Link>
                        </div>
                        <div className="text-[var(--muted-foreground)]">
                          <span className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">Ứng tuyển:</span>
                          <span className="text-sm">{formatDate(application.appliedAt)}</span>
                        </div>
                        {application.coverLetter && (
                          <div className="border-t border-[var(--border)] pt-2">
                            <p className="mb-1 text-xs font-medium text-[var(--muted-foreground)]">Thư giới thiệu:</p>
                            <p className="line-clamp-3 text-xs leading-relaxed text-[var(--muted-foreground)]">{application.coverLetter}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[var(--muted-foreground)]">
                Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, pagination?.total || 0)} trong tổng số{" "}
                {pagination?.total || 0} ứng viên
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
        </>
      )}

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái ứng tuyển</DialogTitle>
            <DialogDescription>
              {selectedApplication ? (
                <>
                  Ứng viên: <strong>{selectedApplication.user?.name || selectedApplication.user?.email}</strong>
                  <br />
                  Vị trí: <strong>{selectedApplication.job?.title}</strong>
                  <br />
                  <span className="mt-2 block text-xs">
                    Khi bạn cập nhật, ứng viên sẽ nhận thông báo trên JOYWORK và email (nếu tài khoản có email đã xác minh).
                  </span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="status">Trạng thái</Label>
              <select
                id="status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
              >
                <option value="RECEIVED">Tiếp nhận</option>
                <option value="SUITABLE">Phù hợp</option>
                <option value="INTERVIEW_SCHEDULED">Hẹn phỏng vấn</option>
                <option value="OFFER_SENT">Gửi đề nghị</option>
                <option value="HIRED">Nhận việc</option>
                <option value="NOT_SUITABLE">Chưa phù hợp</option>
              </select>
            </div>
            <div>
              <Label htmlFor="notes">Phản hồi của doanh nghiệp (tùy chọn)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thêm phản hồi cho ứng viên này..."
                rows={4}
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{notes.length}/1000 ký tự</p>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={!newStatus || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

