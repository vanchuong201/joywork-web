"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { useAuthStore } from "@/store/useAuth";
import { getCvFlipAccessCompanies, listCompanyCvFlipRequests } from "@/lib/api/cv-flip";
import { buildCompanyCandidateUrl } from "@/lib/candidate-url";
import { CV_FLIP_REQUEST_STATUS_LABEL, cvFlipCompanyRequestStatusLabel } from "@/lib/cv-flip-copy";
import { buildJobUrl } from "@/lib/job-url";
import { cn, formatDate } from "@/lib/utils";
import type { CvFlipRequestStatus } from "@/types/cv-flip";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import CompanySelectorModal from "./CompanySelectorModal";
import SelectedCompanySummary from "./SelectedCompanySummary";

const SELECTED_COMPANY_KEY = "cvFlip.selectedCompanyId";
const PAGE_SIZE = 20;

const STATUS_FILTERS: Array<{ value: "all" | CvFlipRequestStatus; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "REJECTED", label: CV_FLIP_REQUEST_STATUS_LABEL.REJECTED },
  { value: "PENDING", label: CV_FLIP_REQUEST_STATUS_LABEL.PENDING },
  { value: "APPROVED", label: CV_FLIP_REQUEST_STATUS_LABEL.APPROVED },
  { value: "EXPIRED", label: CV_FLIP_REQUEST_STATUS_LABEL.EXPIRED },
];

export default function CvFlipCompanyRequestsPage() {
  const router = useRouter();
  const { user, initialized, loading } = useAuthStore();
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CvFlipRequestStatus>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [reselectModalOpen, setReselectModalOpen] = useState(false);
  const [modalDraftCompanyId, setModalDraftCompanyId] = useState("");
  const companyModalWasOpen = useRef(false);

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.replace("/login");
    }
  }, [initialized, loading, user, router]);

  const accessQuery = useQuery({
    queryKey: ["cv-flip-access"],
    queryFn: getCvFlipAccessCompanies,
    enabled: initialized && !loading && !!user,
  });

  const companies = useMemo(() => accessQuery.data ?? [], [accessQuery.data]);
  const selectedCompany = companies.find((company) => company.id === selectedCompanyId) ?? null;

  useEffect(() => {
    if (!companies.length) return;
    const cached = typeof window !== "undefined" ? localStorage.getItem(SELECTED_COMPANY_KEY) : null;
    if (cached && companies.some((company) => company.id === cached)) {
      setSelectedCompanyId(cached);
      return;
    }
    setSelectedCompanyId(companies[0].id);
  }, [companies]);

  useEffect(() => {
    if (!selectedCompanyId) return;
    if (typeof window !== "undefined") {
      localStorage.setItem(SELECTED_COMPANY_KEY, selectedCompanyId);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, selectedCompanyId]);

  const requestsQuery = useQuery({
    queryKey: ["cv-flip-company-requests", selectedCompanyId, statusFilter, currentPage],
    queryFn: () =>
      listCompanyCvFlipRequests({
        companyId: selectedCompanyId,
        page: currentPage,
        limit: PAGE_SIZE,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    enabled: initialized && !loading && !!user && !!selectedCompanyId,
  });

  useEffect(() => {
    if (reselectModalOpen && !companyModalWasOpen.current) {
      setModalDraftCompanyId(selectedCompanyId || "");
    }
    companyModalWasOpen.current = reselectModalOpen;
  }, [reselectModalOpen, selectedCompanyId]);

  const handleConfirmCompanySelection = useCallback(() => {
    if (!modalDraftCompanyId) return;
    setSelectedCompanyId(modalDraftCompanyId);
    setReselectModalOpen(false);
  }, [modalDraftCompanyId]);

  const requests = requestsQuery.data?.requests ?? [];
  const pagination = requestsQuery.data?.pagination ?? {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  };

  if (!initialized || loading || accessQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-4 text-sm text-[var(--muted-foreground)]">
        Đang tải dữ liệu...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-6">
      <CompanySelectorModal
        open={reselectModalOpen}
        onOpenChange={setReselectModalOpen}
        companies={companies}
        draftCompanyId={modalDraftCompanyId}
        onDraftCompanyIdChange={setModalDraftCompanyId}
        onConfirm={handleConfirmCompanySelection}
        onCreateCompany={() => router.push("/companies/new")}
      />

      <div className="space-y-3">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold">Quản lý yêu cầu mở CV</h1>
          {selectedCompany ? (
            <SelectedCompanySummary
              company={selectedCompany}
              onChangeClick={companies.length > 1 ? () => setReselectModalOpen(true) : undefined}
            />
          ) : null}
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">
          Theo dõi yêu cầu mở CV và các CV đã mở trực tiếp của doanh nghiệp đã chọn.
        </p>
      </div>

      {companies.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] px-4 py-8 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Bạn chưa có doanh nghiệp để xem yêu cầu mở CV.
          </p>
          <Button asChild className="mt-4">
            <Link href="/candidates">Về trang ứng viên</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.value}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "h-8 px-3 text-xs",
                  statusFilter === filter.value && "bg-[var(--muted)] font-medium text-[var(--foreground)]",
                )}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {requestsQuery.isLoading ? (
            <p className="text-sm text-[var(--muted-foreground)]">Đang tải danh sách yêu cầu...</p>
          ) : requestsQuery.isError ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              Không tải được danh sách yêu cầu. Vui lòng thử lại.
            </p>
          ) : requests.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              {statusFilter === "APPROVED"
                ? "Chưa có CV đã đồng ý hoặc đã mở trực tiếp."
                : `Chưa có yêu cầu mở CV nào${statusFilter === "all" ? "" : " ở trạng thái này"}.`}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ứng viên</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                    <th className="px-4 py-3 font-medium">Ngày</th>
                    <th className="px-4 py-3 font-medium">Link CV</th>
                    <th className="px-4 py-3 font-medium">Link JD</th>
                    <th className="px-4 py-3 font-medium">Lời nhắn</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => {
                    const profileHref = buildCompanyCandidateUrl(
                      request.candidate.slug || request.candidate.id,
                      selectedCompanyId,
                    );
                    const displayName = request.candidate.name?.trim() || "Ứng viên";

                    return (
                      <tr key={request.id} className="border-b border-[var(--border)] last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {request.candidate.avatar ? (
                              <img
                                src={request.candidate.avatar}
                                alt=""
                                className="h-8 w-8 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--muted)]">
                                <User className="h-4 w-4 text-[var(--muted-foreground)]" />
                              </div>
                            )}
                            <span className="font-medium text-[var(--foreground)]">{displayName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-md border border-[var(--border)] px-2 py-0.5 text-xs",
                              request.status === "APPROVED" && "border-transparent bg-[var(--muted)] font-medium",
                              request.status === "REJECTED" && "text-[var(--muted-foreground)]",
                              request.status === "EXPIRED" && "text-[var(--muted-foreground)]",
                            )}
                          >
                            {cvFlipCompanyRequestStatusLabel(request.status, request.source)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--muted-foreground)]">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={profileHref}
                            className="font-medium underline underline-offset-2"
                          >
                            Xem hồ sơ
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {request.job ? (
                            <Link
                              href={buildJobUrl(request.job)}
                              className="underline underline-offset-2"
                            >
                              {request.job.title}
                            </Link>
                          ) : (
                            <span className="text-[var(--muted-foreground)]">—</span>
                          )}
                        </td>
                        <td className="max-w-xs px-4 py-3">
                          {request.message ? (
                            <p className="whitespace-pre-line text-[var(--foreground)]">{request.message}</p>
                          ) : (
                            <span className="text-[var(--muted-foreground)]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
