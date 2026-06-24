"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { OwnUserProfile } from "@/types/user";

const isFilledText = (value?: string | null) => Boolean(value?.trim());

const hasNonEmptyArrayItem = (items?: string[] | null) =>
  (items || []).some((item) => item.trim().length > 0);

export type ProfileCompletionItem = {
  key: "basicInfo" | "ksa" | "expectations" | "experiences" | "educations";
  label: string;
  completed: boolean;
};

export type ProfileCompletionResult = {
  completionItems: ProfileCompletionItem[];
  completionPercent: number;
  isComplete: boolean;
};

export type CvApplyReadinessResult = {
  isReady: boolean;
  hasBasicInfo: boolean;
  hasKsa: boolean;
  hasExperiences: boolean;
  missingItems: string[];
};

function isBasicInfoComplete(profile?: OwnUserProfile | null): boolean {
  if (!profile) return false;

  const hasAvatar = Boolean(profile.profile?.avatar || profile.avatar);
  const hasFullName = isFilledText(profile.profile?.fullName || profile.name);
  const hasTitle = isFilledText(profile.profile?.title);
  const hasBio = isFilledText(profile.profile?.bio);
  const hasContactEmail = isFilledText(profile.profile?.contactEmail || profile.email);
  const hasContactPhone = isFilledText(profile.profile?.contactPhone || profile.phone);
  const hasLocation =
    hasNonEmptyArrayItem(profile.profile?.locations) || isFilledText(profile.profile?.location);

  return (
    hasAvatar &&
    hasFullName &&
    hasTitle &&
    hasBio &&
    hasContactEmail &&
    hasContactPhone &&
    hasLocation
  );
}

export function buildCvApplyReadiness(profile?: OwnUserProfile | null): CvApplyReadinessResult {
  const cvProfile = profile?.profile;
  const experiences = profile?.experiences ?? [];

  const hasBasicInfo = isBasicInfoComplete(profile);
  const hasKsa =
    hasNonEmptyArrayItem(cvProfile?.knowledge) ||
    hasNonEmptyArrayItem(cvProfile?.skills) ||
    hasNonEmptyArrayItem(cvProfile?.attitude);

  const hasExperiences = experiences.length > 0;

  const missingItems: string[] = [];
  if (!hasBasicInfo) missingItems.push("Thông tin cơ bản");
  if (!hasKsa) missingItems.push("Năng lực (KSA)");
  if (!hasExperiences) missingItems.push("Kinh nghiệm làm việc");

  return {
    isReady: hasBasicInfo && hasKsa && hasExperiences,
    hasBasicInfo,
    hasKsa,
    hasExperiences,
    missingItems,
  };
}

export function buildProfileCompletion(profile?: OwnUserProfile | null): ProfileCompletionResult {
  if (!profile) {
    return {
      completionItems: [
        { key: "basicInfo", label: "Thông tin cơ bản", completed: false },
        { key: "ksa", label: "Năng lực (KSA)", completed: false },
        { key: "expectations", label: "Mong muốn (Quyền lợi)", completed: false },
        { key: "experiences", label: "Kinh nghiệm làm việc", completed: false },
        { key: "educations", label: "Học vấn", completed: false },
      ],
      completionPercent: 0,
      isComplete: false,
    };
  }

  const completionItems: ProfileCompletionItem[] = [
    {
      key: "basicInfo",
      label: "Thông tin cơ bản",
      completed: isBasicInfoComplete(profile),
    },
    {
      key: "ksa",
      label: "Năng lực (KSA)",
      completed:
        hasNonEmptyArrayItem(profile.profile?.knowledge) ||
        hasNonEmptyArrayItem(profile.profile?.skills) ||
        hasNonEmptyArrayItem(profile.profile?.attitude),
    },
    {
      key: "expectations",
      label: "Mong muốn (Quyền lợi)",
      completed:
        isFilledText(profile.profile?.expectedCulture) ||
        hasNonEmptyArrayItem(profile.profile?.careerGoals) ||
        profile.profile?.expectedSalaryMin != null ||
        profile.profile?.expectedSalaryMax != null ||
        isFilledText(profile.profile?.workMode),
    },
    {
      key: "experiences",
      label: "Kinh nghiệm làm việc",
      completed: (profile.experiences || []).length > 0,
    },
    {
      key: "educations",
      label: "Học vấn",
      completed: (profile.educations || []).length > 0,
    },
  ];

  const completedItemCount = completionItems.filter((item) => item.completed).length;
  const completionPercent = completedItemCount * 20;

  return {
    completionItems,
    completionPercent,
    isComplete: completionPercent === 100,
  };
}

type UseProfileCompletionOptions = {
  enabled?: boolean;
  profile?: OwnUserProfile | null;
};

export function useProfileCompletion(options?: UseProfileCompletionOptions) {
  const { enabled = true, profile } = options ?? {};

  const { data, isLoading } = useQuery({
    queryKey: ["own-profile"],
    queryFn: async () => {
      const res = await api.get("/api/users/me/profile");
      return res.data.data.profile as OwnUserProfile;
    },
    enabled: enabled && !profile,
    staleTime: 5 * 60 * 1000,
  });

  const sourceProfile = profile ?? data;
  const completion = useMemo(() => buildProfileCompletion(sourceProfile), [sourceProfile]);

  return {
    ...completion,
    isLoading: enabled && !profile ? isLoading : false,
    hasProfile: Boolean(sourceProfile),
  };
}
