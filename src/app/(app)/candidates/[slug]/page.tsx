"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuth";
import {
  flipCandidate,
  getCvFlipAccessCompanies,
  getCvFlipCandidateDetail,
  getCvFlipUsage,
} from "@/lib/api/cv-flip";
import { CV_FLIP_PREMIUM_REQUIRED_MESSAGE } from "@/lib/cv-flip-copy";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import CvFlipUsageBadge from "@/components/candidates/CvFlipUsageBadge";
import PublicProfilePageContent from "@/components/profile/PublicProfilePageContent";
import type { PublicUserProfile } from "@/types/user";

const SELECTED_COMPANY_KEY = "cvFlip.selectedCompanyId";

type Props = {
  params: Promise<{ slug: string }>;
};

function mergeContactsFromCvFlip(
  base: PublicUserProfile,
  cv: Awaited<ReturnType<typeof getCvFlipCandidateDetail>>
): PublicUserProfile {
  if (!base.profile) return base;
  return {
    ...base,
    profile: {
      ...base.profile,
      contactEmail: cv.candidate.profile.contactEmail,
      contactPhone: cv.candidate.profile.contactPhone,
      cvUrl: cv.candidate.profile.cvUrl,
    },
  };
}

export default function CandidateDetailPage({ params }: Props) {
  const { slug: rawSlug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user, initialized, loading } = useAuthStore();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const safeSlug = useMemo(() => decodeURIComponent(rawSlug), [rawSlug]);

  const companyId =
    searchParams.get("companyId") ||
    (typeof window !== "undefined" ? localStorage.getItem(SELECTED_COMPANY_KEY) ?? "" : "");

  useEffect(() => {
    if (initialized && !loading && !user) {
      router.replace("/login");
    }
  }, [initialized, loading, user, router]);

  const profileQuery = useQuery({
    queryKey: ["public-profile-by-slug", safeSlug, companyId || ""],
    queryFn: async () => {
      const qs = companyId
        ? `?companyId=${encodeURIComponent(companyId)}`
        : "";
      const res = await api.get<{ data: { profile: PublicUserProfile } }>(
        `/api/users/profile/${encodeURIComponent(safeSlug)}${qs}`
      );
      return res.data.data.profile;
    },
    enabled: initialized && !loading && !!user,
    retry: false,
  });

  const isOwnProfile = Boolean(user?.id && profileQuery.data?.id && user.id === profileQuery.data.id);

  const needsCvFlipLayer = Boolean(companyId && profileQuery.data && !isOwnProfile);

  const cvDetailQuery = useQuery({
    queryKey: ["cv-flip-candidate-detail", safeSlug, companyId],
    queryFn: () => getCvFlipCandidateDetail(safeSlug, companyId || undefined),
    enabled: initialized && !loading && !!user && needsCvFlipLayer,
    retry: false,
  });

  const usageQuery = useQuery({
    queryKey: ["cv-flip-usage", companyId],
    queryFn: () => getCvFlipUsage(companyId),
    enabled: initialized && !loading && !!user && needsCvFlipLayer && !!companyId,
  });

  const accessCompaniesQuery = useQuery({
    queryKey: ["cv-flip-access"],
    queryFn: getCvFlipAccessCompanies,
    enabled: initialized && !loading && !!user && needsCvFlipLayer && !!companyId,
  });

  const companyAccess = useMemo(
    () => accessCompaniesQuery.data?.find((c) => c.id === companyId),
    [accessCompaniesQuery.data, companyId]
  );
  const isPremiumCompany = companyAccess?.isPremium === true;

  const displayProfile = useMemo((): PublicUserProfile | null => {
    const base = profileQuery.data;
    if (!base) return null;
    if (!needsCvFlipLayer) return base;
    if (!cvDetailQuery.data) return null;
    return mergeContactsFromCvFlip(base, cvDetailQuery.data);
  }, [profileQuery.data, cvDetailQuery.data, needsCvFlipLayer]);

  const flipMutation = useMutation({
    mutationFn: async () => {
      const id = cvDetailQuery.data?.candidate?.userId ?? profileQuery.data?.id;
      if (!id || !companyId) return null;
      return flipCandidate(companyId, id);
    },
    onSuccess: (result) => {
      setConfirmOpen(false);
      if (!result) return;
      if (result.status === "REQUESTED") {
        toast.success("Đã gửi yêu cầu đến ứng viên. Chờ ứng viên đồng ý.");
      } else {
        toast.success("Mở CV thành công.");
      }
      queryClient.invalidateQueries({ queryKey: ["cv-flip-candidate-detail", safeSlug, companyId] });
      queryClient.invalidateQueries({ queryKey: ["cv-flip-usage", companyId] });
    },
    onError: (error: unknown) => {
      const maybeAxiosError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      const message =
        maybeAxiosError.response?.data?.error?.message || "Không thể mở CV lúc này.";
      toast.error(message);
    },
  });

  if (!initialized || loading) {
    return <div className="mx-auto max-w-4xl p-4 text-sm text-slate-500">Đang tải...</div>;
  }

  if (!user) return null;

  if (profileQuery.isLoading || (needsCvFlipLayer && (cvDetailQuery.isLoading || cvDetailQuery.isFetching))) {
    return <div className="mx-auto max-w-4xl p-4 text-sm text-slate-500">Đang tải hồ sơ ứng viên...</div>;
  }

  if (profileQuery.error || !profileQuery.data) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4">
        <p className="text-sm text-red-600">Không tìm thấy hồ sơ hoặc hồ sơ đang ở chế độ riêng tư.</p>
        <Link href="/candidates" className="text-sm text-[var(--brand)] hover:underline">
          Quay lại danh sách ứng viên
        </Link>
      </div>
    );
  }

  if (needsCvFlipLayer && cvDetailQuery.error) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4">
        <p className="text-sm text-red-600">Không tải được trạng thái mở CV (doanh nghiệp).</p>
        <Link href="/candidates" className="text-sm text-[var(--brand)] hover:underline">
          Quay lại danh sách ứng viên
        </Link>
      </div>
    );
  }

  if (!displayProfile) {
    return null;
  }

  const access = cvDetailQuery.data?.access;
  const showFlipChrome = Boolean(needsCvFlipLayer && access);
  const allowCvFlip = profileQuery.data?.profile?.allowCvFlip !== false;
  const showStickyFooter = showFlipChrome && access && !access.isFlipped;

  const openConfirm = () => {
    if (!access || access.isFlipped || access.hasPendingRequest) return;
    setConfirmOpen(true);
  };

  const usageReady =
    !showFlipChrome || usageQuery.isSuccess || usageQuery.isError;
  const canSubmitDirect =
    isPremiumCompany &&
    allowCvFlip &&
    usageReady &&
    (usageQuery.data?.total.remaining ?? 0) > 0;
  const canSubmitRequest =
    isPremiumCompany &&
    !allowCvFlip &&
    usageReady &&
    (usageQuery.data?.request.remaining ?? 0) > 0;

  return (
    <div className="relative">
      <div className="border-b border-[var(--border)] bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* <Link href="/candidates" className="text-sm text-[var(--brand)] hover:underline">
              ← Danh sách ứng viên
            </Link> */}
            {/* <Link href={`/profile/${displayProfile.slug || displayProfile.id}`} className="text-sm text-slate-600 hover:underline">
              Mở dạng profile công khai
            </Link> */}
          </div>
          {showFlipChrome && usageQuery.data ? (
            <CvFlipUsageBadge usage={usageQuery.data} />
          ) : null}
        </div>
        {showFlipChrome && access?.isFlipped ? (
          <p className="mx-auto mt-2 max-w-5xl text-xs text-emerald-700">
            Đã mở thông tin liên hệ cho doanh nghiệp này trong tháng.
          </p>
        ) : null}
      </div>

      <PublicProfilePageContent
        profile={displayProfile}
        cvFlipHeader={
          needsCvFlipLayer
            ? { enabled: true, revealed: Boolean(access?.isFlipped) }
            : undefined
        }
        className={cn(
          "min-h-screen bg-slate-50",
          showStickyFooter ? "pb-32" : "pb-20"
        )}
      />

      {showStickyFooter && access ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center border-t border-[var(--border)] bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(15,23,42,0.08)] backdrop-blur supports-[backdrop-filter]:bg-white/85">
          <div className="pointer-events-auto flex w-full max-w-5xl flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--muted-foreground)] sm:max-w-[55%]">
              {access.hasPendingRequest
                ? "Đang chờ ứng viên phản hồi yêu cầu xem thông tin liên hệ."
                : allowCvFlip
                  ? "Thông tin liên hệ đang được ẩn. Bấm để xác nhận trước khi xem (tính lượt mở CV)."
                  : "Ứng viên yêu cầu xin phép trước. Gửi yêu cầu để ứng viên đồng ý hoặc từ chối."}
            </p>
            <Button
              type="button"
              size="lg"
              className="w-full shrink-0 sm:w-auto"
              disabled={flipMutation.isPending || access.hasPendingRequest}
              onClick={openConfirm}
            >
              {flipMutation.isPending
                ? "Đang xử lý..."
                : access.hasPendingRequest
                  ? "Đang chờ phản hồi"
                  : "Xem thông tin"}
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {accessCompaniesQuery.isLoading
                ? "Đang kiểm tra..."
                : !isPremiumCompany
                  ? "Tính năng trả phí"
                  : allowCvFlip
                    ? "Xác nhận xem thông tin liên hệ"
                    : "Gửi yêu cầu xem thông tin"}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1 text-sm text-[var(--muted-foreground)]">
                {accessCompaniesQuery.isLoading ? (
                  <p>Đang kiểm tra gói dịch vụ doanh nghiệp...</p>
                ) : !isPremiumCompany ? (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                    {CV_FLIP_PREMIUM_REQUIRED_MESSAGE}
                  </div>
                ) : allowCvFlip ? (
                  <>
                    <p>Bạn có đồng ý xem thông tin liên hệ của ứng viên này không?</p>
                    <p>
                      Nếu đồng ý, hệ thống tính <strong>1 lượt mở CV</strong>. Số lần mở còn lại trong
                      tháng:{" "}
                      <strong>
                        {usageQuery.data ? usageQuery.data.total.remaining : "—"}
                      </strong>
                      {usageQuery.data ? (
                        <>
                          {" "}
                          / {usageQuery.data.total.limit}
                        </>
                      ) : null}
                      .
                    </p>
                    {!canSubmitDirect && usageQuery.data ? (
                      <p className="text-amber-800">
                        Bạn đã hết lượt mở CV trong tháng. Vui lòng thử lại sau hoặc liên hệ vận hành.
                      </p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p>
                      Ứng viên đã bật chế độ: doanh nghiệp cần <strong>gửi yêu cầu</strong> trước khi xem
                      thông tin liên hệ. Ứng viên sẽ nhận thông báo và email để Đồng ý hoặc Từ chối.
                    </p>
                    <p>
                      Lượt gửi yêu cầu còn lại trong tháng:{" "}
                      <strong>
                        {usageQuery.data ? usageQuery.data.request.remaining : "—"}
                      </strong>
                      {usageQuery.data ? (
                        <>
                          {" "}
                          / {usageQuery.data.request.limit}
                        </>
                      ) : null}
                      .
                    </p>
                    {!canSubmitRequest && usageQuery.data ? (
                      <p className="text-amber-800">
                        Bạn đã hết lượt gửi yêu cầu trong tháng.
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            {accessCompaniesQuery.isLoading || !isPremiumCompany ? (
              <Button type="button" onClick={() => setConfirmOpen(false)}>
                Đóng
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
                  Hủy
                </Button>
                {allowCvFlip ? (
                  <Button
                    type="button"
                    disabled={flipMutation.isPending || !canSubmitDirect}
                    onClick={() => flipMutation.mutate()}
                  >
                    {flipMutation.isPending ? "Đang xử lý..." : "Đồng ý và xem"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={flipMutation.isPending || !canSubmitRequest}
                    onClick={() => flipMutation.mutate()}
                  >
                    {flipMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu đến ứng viên"}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
