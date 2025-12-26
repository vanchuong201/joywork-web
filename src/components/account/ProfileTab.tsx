"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { OwnUserProfile } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import ProfileBasicInfo from "@/components/account/profile/ProfileBasicInfo";
import ProfileKSA from "@/components/account/profile/ProfileKSA";
import ProfileExpectations from "@/components/account/profile/ProfileExpectations";
import ProfileExperiences from "@/components/account/profile/ProfileExperiences";
import ProfileEducations from "@/components/account/profile/ProfileEducations";

export default function ProfileTab() {
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
        <h1 className="text-2xl font-bold">Hồ sơ ứng tuyển</h1>
        <EmptyState
          title="Không tải được hồ sơ"
          subtitle="Vui lòng thử lại hoặc liên hệ đội hỗ trợ nếu lỗi tiếp diễn."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hồ sơ ứng tuyển</h1>
        <p className="text-sm text-slate-500 mt-1">Quản lý thông tin hồ sơ và CV của bạn</p>
      </div>

      <ProfileBasicInfo profile={data} />
      <ProfileKSA profile={data} />
      <ProfileExpectations profile={data} />
      <ProfileExperiences experiences={data.experiences || []} />
      <ProfileEducations educations={data.educations || []} />
    </div>
  );
}

