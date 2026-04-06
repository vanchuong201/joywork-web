"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { OwnUserProfile } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, Clock, ExternalLink, Sparkles } from "lucide-react";
import ProfileBasicInfo from "@/components/account/profile/ProfileBasicInfo";
import ProfileKSA from "@/components/account/profile/ProfileKSA";
import ProfileExpectations from "@/components/account/profile/ProfileExpectations";
import ProfileExperiences from "@/components/account/profile/ProfileExperiences";
import ProfileEducations from "@/components/account/profile/ProfileEducations";
import TalentPoolStatus from "@/components/talent-pool/TalentPoolStatus";

type TalentPoolMyStatus = {
  member: { id: string; status: string; source: string; reason: string | null; createdAt: string } | null;
  latestRequest: { id: string; status: string; message: string | null; reason: string | null; createdAt: string; reviewedAt: string | null } | null;
};

export default function ProfileTab() {
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["own-profile"],
    queryFn: async () => {
      const res = await api.get("/api/users/me/profile");
      return res.data.data.profile as OwnUserProfile;
    },
  });
  const { data: talentPoolStatus, isLoading: isTalentPoolLoading } = useQuery<TalentPoolMyStatus>({
    queryKey: ["talent-pool-me"],
    queryFn: async () => {
      const res = await api.get("/api/talent-pool/me");
      return res.data.data;
    },
  });

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
        <h1 className="text-xl font-bold sm:text-2xl">Hồ sơ ứng tuyển</h1>
        <EmptyState
          title="Không tải được hồ sơ"
          subtitle="Vui lòng thử lại hoặc liên hệ đội hỗ trợ nếu lỗi tiếp diễn."
        />
      </div>
    );
  }

  const profileSlug = data.slug || data.id;
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
          <h1 className="text-xl font-bold sm:text-2xl">Hồ sơ ứng tuyển</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Quản lý thông tin hồ sơ và CV của bạn</p>
        </div>
        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href={`/profile/${profileSlug}`} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-2" />
            Xem trang hồ sơ công khai
          </Link>
        </Button>
      </div>

      {isTalentPoolLoading ? (
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
                  <span className="text-[11px] font-medium text-slate-700">Dành cho ứng viên xuất sắc</span>
                </div>
              )}
              <p className="text-2xl font-bold text-white">
                {isActive ? "Bạn đã là thành viên Talent Pool" : isPending ? "Yêu cầu đang được xét duyệt" : "Gia nhập Talent Pool"}
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
              <Button variant="secondary" asChild className="w-full md:w-auto">
                <Link href={`/profile/${profileSlug}`} target="_blank" rel="noopener noreferrer">
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
      )}

      <TalentPoolStatus
        open={isJoinDialogOpen}
        onOpenChange={setIsJoinDialogOpen}
        latestRequest={talentPoolStatus?.latestRequest ?? null}
      />

      <ProfileBasicInfo profile={data} />
      <ProfileKSA profile={data} />
      <ProfileExpectations profile={data} />
      <ProfileExperiences experiences={data.experiences || []} />
      <ProfileEducations educations={data.educations || []} />
    </div>
  );
}

