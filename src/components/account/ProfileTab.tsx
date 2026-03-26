"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { OwnUserProfile } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ChevronRight, ExternalLink, Sparkles } from "lucide-react";
import ProfileBasicInfo from "@/components/account/profile/ProfileBasicInfo";
import ProfileKSA from "@/components/account/profile/ProfileKSA";
import ProfileExpectations from "@/components/account/profile/ProfileExpectations";
import ProfileExperiences from "@/components/account/profile/ProfileExperiences";
import ProfileEducations from "@/components/account/profile/ProfileEducations";
import TalentPoolStatus from "@/components/talent-pool/TalentPoolStatus";

export default function ProfileTab() {
  const [showTalentPoolStatus, setShowTalentPoolStatus] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["own-profile"],
    queryFn: async () => {
      const res = await api.get("/api/users/me/profile");
      return res.data.data.profile as OwnUserProfile;
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

      <button
        type="button"
        onClick={() => setShowTalentPoolStatus((prev) => !prev)}
        className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#0B163E] text-left transition hover:opacity-95"
      >
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:gap-6 md:p-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#FFC107] px-3 py-1 text-xs font-semibold text-slate-900">
              <Sparkles className="h-3.5 w-3.5" />
              PREMIUM
              <span className="text-[11px] font-medium text-slate-700">Dành cho ứng viên xuất sắc</span>
            </div>
            <p className="text-2xl font-bold text-white">Gia nhập Talent Pool</p>
            <p className="max-w-2xl text-sm text-slate-200">
              Đưa hồ sơ của bạn vào tầm ngắm của các Nhà tuyển dụng hàng đầu. Nhấn để xem trạng thái tham gia hoặc gửi yêu cầu.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-[#FF8A00] px-5 py-3 text-sm font-semibold text-slate-900">
            {showTalentPoolStatus ? "Ẩn chi tiết" : "Tham gia ngay"}
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </button>

      {showTalentPoolStatus ? <TalentPoolStatus /> : null}

      <ProfileBasicInfo profile={data} />
      <ProfileKSA profile={data} />
      <ProfileExpectations profile={data} />
      <ProfileExperiences experiences={data.experiences || []} />
      <ProfileEducations educations={data.educations || []} />
    </div>
  );
}

