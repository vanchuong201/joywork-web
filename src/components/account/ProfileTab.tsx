"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { OwnUserProfile } from "@/types/user";
import type { CvImportStatus } from "@/types/cv-import";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import ProfileBasicInfo from "@/components/account/profile/ProfileBasicInfo";
import ProfileDiscoverySettings from "@/components/account/profile/ProfileDiscoverySettings";
import ProfileKSA from "@/components/account/profile/ProfileKSA";
import ProfileExpectations from "@/components/account/profile/ProfileExpectations";
import ProfileExperiences from "@/components/account/profile/ProfileExperiences";
import ProfileEducations from "@/components/account/profile/ProfileEducations";
import TalentPoolStatus from "@/components/talent-pool/TalentPoolStatus";
import { buildProfileCompletion } from "@/hooks/useProfileCompletion";
import {
  listMyCvFlipRequests,
  respondMyCvFlipRequest,
} from "@/lib/api/cv-flip";
import { getCvImport } from "@/lib/api/cv-imports";
import { buildCandidateProfileUrl } from "@/lib/candidate-url";
import { toast } from "sonner";
import CvExportButton from "@/components/cv/CvExportButton";

type TalentPoolMyStatus = {
  member: {
    id: string;
    status: string;
    source: string;
    reason: string | null;
    createdAt: string;
  } | null;
  latestRequest: {
    id: string;
    status: string;
    message: string | null;
    reason: string | null;
    createdAt: string;
    reviewedAt: string | null;
  } | null;
};

/** Tạm ẩn banner Talent Pool — đổi thành `true` để bật lại */
const SHOW_TALENT_POOL_BANNER = false;
const CV_JOB_POLL_INTERVAL_MS = 3000;
const CV_JOB_POLL_MAX_ATTEMPTS = 60;

export default function ProfileTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [cvJobStatus, setCvJobStatus] = useState<CvImportStatus | null>(null);
  const [cvJobError, setCvJobError] = useState<string | null>(null);
  const [cvJobPollAttempts, setCvJobPollAttempts] = useState(0);
  const [isCheckingCvJob, setIsCheckingCvJob] = useState(false);
  const cvJobId = searchParams.get("cvJob");
  const {
    data,
    isLoading,
    isError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["own-profile"],
    queryFn: async () => {
      const res = await api.get("/api/users/me/profile");
      return res.data.data.profile as OwnUserProfile;
    },
  });
  const { data: talentPoolStatus, isLoading: isTalentPoolLoading } =
    useQuery<TalentPoolMyStatus>({
      queryKey: ["talent-pool-me"],
      queryFn: async () => {
        const res = await api.get("/api/talent-pool/me");
        return res.data.data;
      },
      enabled: SHOW_TALENT_POOL_BANNER,
    });
  const { data: cvFlipRequests, isLoading: isCvFlipRequestsLoading } = useQuery(
    {
      queryKey: ["cv-flip-my-requests"],
      queryFn: () => listMyCvFlipRequests({ page: 1, limit: 20 }),
    },
  );

  const respondRequestMutation = useMutation({
    mutationFn: async ({
      requestId,
      action,
    }: {
      requestId: string;
      action: "approve" | "reject";
    }) => respondMyCvFlipRequest(requestId, action),
    onSuccess: (_data, variables) => {
      toast.success(
        variables.action === "approve"
          ? "Bạn đã đồng ý yêu cầu mở CV."
          : "Bạn đã từ chối yêu cầu mở CV.",
      );
      queryClient.invalidateQueries({ queryKey: ["cv-flip-my-requests"] });
    },
    onError: (error: unknown) => {
      const maybeAxiosError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      toast.error(
        maybeAxiosError.response?.data?.error?.message ||
          "Không thể xử lý yêu cầu lúc này.",
      );
      queryClient.invalidateQueries({ queryKey: ["cv-flip-my-requests"] });
    },
  });

  const clearCvJobQueryParam = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cvJob");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `/account/profile?${nextQuery}` : "/account/profile");
  }, [router, searchParams]);

  const checkCvJob = useCallback(async (): Promise<CvImportStatus | null> => {
    if (!cvJobId) return null;
    setIsCheckingCvJob(true);
    try {
      const job = await getCvImport(cvJobId);
      setCvJobStatus(job.status);
      setCvJobError(job.errorMessage ?? null);
      return job.status;
    } catch {
      setCvJobError("Không thể kiểm tra trạng thái xử lý CV. Vui lòng thử lại.");
      return null;
    } finally {
      setIsCheckingCvJob(false);
    }
  }, [cvJobId]);

  useEffect(() => {
    if (!cvJobId) {
      setCvJobStatus(null);
      setCvJobError(null);
      setCvJobPollAttempts(0);
      return;
    }
    setCvJobPollAttempts(0);
    void checkCvJob();
  }, [cvJobId, checkCvJob]);

  const isCvJobRunning =
    !!cvJobId &&
    (cvJobStatus === null ||
      cvJobStatus === "PENDING" ||
      cvJobStatus === "PROCESSING" ||
      cvJobStatus === "READY");
  const isCvJobTimedOut = isCvJobRunning && cvJobPollAttempts >= CV_JOB_POLL_MAX_ATTEMPTS;

  useEffect(() => {
    if (!cvJobId || !isCvJobRunning || isCvJobTimedOut) return;

    const timer = window.setTimeout(() => {
      setCvJobPollAttempts((prev) => prev + 1);
      void checkCvJob();
    }, CV_JOB_POLL_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [cvJobId, isCvJobRunning, isCvJobTimedOut, cvJobPollAttempts, checkCvJob]);

  useEffect(() => {
    if (cvJobStatus !== "APPLIED" || !cvJobId) return;
    setCvJobStatus(null);
    void refetchProfile();
    clearCvJobQueryParam();
    toast.success("Hồ sơ đã được cập nhật từ CV.");
  }, [cvJobStatus, cvJobId, refetchProfile, clearCvJobQueryParam]);

  const cvJobBanner = useMemo(() => {
    if (!cvJobId) return null;

    if (cvJobStatus === "FAILED") {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Không thể tự động tạo hồ sơ từ CV.</p>
              <p className="text-xs">
                {cvJobError ||
                  "Vui lòng kiểm tra lại link CV hoặc tải file PDF/DOCX để tạo hồ sơ thủ công."}
              </p>
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCvJobPollAttempts(0);
                    void checkCvJob();
                  }}
                >
                  Tải lại trạng thái
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isCvJobTimedOut) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Quá trình tạo CV đang lâu hơn dự kiến. Bạn có thể tải lại trạng thái hoặc tiếp tục chỉnh sửa hồ sơ thủ công.
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCvJobPollAttempts(0);
                void checkCvJob();
              }}
            >
              Tải lại trạng thái
            </Button>
          </div>
        </div>
      );
    }

    if (!isCvJobRunning) return null;

    return (
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
        <div>
          <p className="font-medium">
            {cvJobStatus === "READY"
              ? "CV nháp đã sẵn sàng, hệ thống đang hoàn tất áp dụng vào hồ sơ."
              : "Hệ thống đang tạo hồ sơ từ CV của bạn."}
          </p>
          <p className="text-xs">
            Trang sẽ tự cập nhật khi hoàn tất. Bạn có thể tiếp tục rà soát thông tin bên dưới.
          </p>
          {isCheckingCvJob ? (
            <p className="mt-1 text-xs text-blue-800">Đang kiểm tra trạng thái mới nhất...</p>
          ) : null}
        </div>
      </div>
    );
  }, [cvJobId, cvJobStatus, cvJobError, isCvJobTimedOut, isCvJobRunning, isCheckingCvJob, checkCvJob]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-200 animate-pulse rounded" />
        <div className="h-96 w-full bg-slate-200 animate-pulse rounded" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold sm:text-2xl">CV của tôi</h1>
        <EmptyState
          title="Không tải được hồ sơ"
          subtitle="Vui lòng thử lại hoặc liên hệ đội hỗ trợ nếu lỗi tiếp diễn."
        />
      </div>
    );
  }

  const profileSlug = data.slug || data.id;
  const candidateProfileHref = buildCandidateProfileUrl(profileSlug);
  const { completionItems, completionPercent } = buildProfileCompletion(data);
  const memberStatus = talentPoolStatus?.member?.status ?? null;
  const requestStatus = talentPoolStatus?.latestRequest?.status ?? null;
  const isActive =
    memberStatus === "ACTIVE" ||
    (!memberStatus && requestStatus === "APPROVED");
  const isPending = requestStatus === "PENDING" && !isActive;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">CV của tôi</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Quản lý thông tin hồ sơ và CV của bạn
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <CvExportButton mode="own" className="w-full sm:w-auto" />
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link
              href={candidateProfileHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Xem hồ sơ trên danh sách ứng viên
            </Link>
          </Button>
        </div>
      </div>

      {cvJobBanner}

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">
              Tiến độ hoàn thiện hồ sơ
            </p>
            <p className="text-2xl font-bold">{completionPercent}%</p>
          </div>
          <p className="text-sm text-amber-600">
            Hoàn thiện 100% hồ sơ sẽ giúp nhà tuyển dụng nhanh chóng tìm thấy
            bạn
          </p>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {completionItems.map((item) => (
            <div
              key={item.key}
              className={`rounded-lg border px-3 py-2 text-sm ${
                item.completed
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {item.completed ? (
                  <CheckCircle2
                    size={14}
                    className="shrink-0 text-emerald-600"
                  />
                ) : (
                  <Circle size={14} className="shrink-0 text-slate-400" />
                )}
                <span className="font-medium">{item.label}</span>
              </div>
              <p className="mt-1 text-xs">
                {item.completed ? "Đã hoàn thành" : "Chưa hoàn thành"}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-base font-semibold">Cài đặt</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Trạng thái tìm việc, hiển thị trong danh sách ứng viên và quyền mở CV.
        </p>
        <div className="mt-4">
          <ProfileDiscoverySettings profile={data} />
        </div>
      </div>

      {SHOW_TALENT_POOL_BANNER &&
        (isTalentPoolLoading ? (
          <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-3 h-8 w-72" />
            <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
            <Skeleton className="mt-2 h-4 w-full max-w-xl" />
          </div>
        ) : (
          <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#0B163E] text-left">
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:gap-6 md:p-6">
              <div className="space-y-2">
                {isActive ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-900">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    ĐÃ LÀ THÀNH VIÊN
                  </div>
                ) : isPending ? (
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                    <Clock className="h-3.5 w-3.5" />
                    ĐANG CHỜ DUYỆT
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full bg-[#FFC107] px-3 py-1 text-xs font-semibold text-slate-900">
                    <Sparkles className="h-3.5 w-3.5" />
                    PREMIUM
                    <span className="text-[11px] font-medium text-slate-700">
                      Dành cho ứng viên xuất sắc
                    </span>
                  </div>
                )}
                <p className="text-2xl font-bold text-white">
                  {isActive
                    ? "Bạn đã là thành viên Talent Pool"
                    : isPending
                      ? "Yêu cầu đang được xét duyệt"
                      : "Gia nhập Talent Pool"}
                </p>
                <p className="max-w-2xl text-sm text-slate-200">
                  {isActive
                    ? "Hồ sơ của bạn đang nằm trong danh sách ứng viên tài năng được JOYWORK tuyển chọn."
                    : isPending
                      ? "JOYWORK đã nhận yêu cầu của bạn. Kết quả xét duyệt sẽ được thông báo qua email."
                      : "Đưa hồ sơ của bạn vào tầm ngắm của các Nhà tuyển dụng hàng đầu. Nhấn để mở form gửi yêu cầu tham gia."}
                </p>
              </div>
              {isActive ? (
                <Button
                  variant="secondary"
                  asChild
                  className="w-full md:w-auto"
                >
                  <Link
                    href={candidateProfileHref}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Xem hồ sơ
                  </Link>
                </Button>
              ) : isPending ? (
                <div className="inline-flex flex-nowrap items-center gap-2 rounded-xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">
                  Đã gửi yêu cầu
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsJoinDialogOpen(true)}
                  className="inline-flex flex-nowrap items-center gap-2 rounded-xl bg-[#FF8A00] px-5 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap transition hover:opacity-95"
                >
                  <span className="whitespace-nowrap">Tham gia ngay</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}

      {SHOW_TALENT_POOL_BANNER && (
        <TalentPoolStatus
          open={isJoinDialogOpen}
          onOpenChange={setIsJoinDialogOpen}
          latestRequest={talentPoolStatus?.latestRequest ?? null}
        />
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-base font-semibold">
          Yêu cầu mở CV từ doanh nghiệp
        </h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Khi bạn tắt quyền cho doanh nghiệp xem trực tiếp thông tin liên hệ,
          yêu cầu sẽ xuất hiện ở đây.
        </p>
        {isCvFlipRequestsLoading ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            Đang tải danh sách yêu cầu...
          </p>
        ) : (cvFlipRequests?.requests?.length ?? 0) === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted-foreground)]">
            Hiện chưa có yêu cầu nào.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {cvFlipRequests?.requests.map((request) => (
              <div
                key={request.id}
                className="rounded-lg border border-[var(--border)] p-3"
              >
                <p className="text-sm font-medium">{request.company.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Trạng thái: {request.status} · Hết hạn:{" "}
                  {new Date(request.expiresAt).toLocaleString("vi-VN")}
                </p>
                {request.status === "PENDING" ? (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        respondRequestMutation.mutate({
                          requestId: request.id,
                          action: "approve",
                        })
                      }
                      disabled={respondRequestMutation.isPending}
                    >
                      Đồng ý
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        respondRequestMutation.mutate({
                          requestId: request.id,
                          action: "reject",
                        })
                      }
                      disabled={respondRequestMutation.isPending}
                    >
                      Từ chối
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <ProfileBasicInfo profile={data} />
      <ProfileKSA profile={data} />
      <ProfileExpectations profile={data} />
      <ProfileExperiences experiences={data.experiences || []} />
      <ProfileEducations educations={data.educations || []} />
    </div>
  );
}
