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

  const missingBasicInfoFields: string[] = [];

  const hasAvatar = Boolean(profile.profile?.avatar || profile.avatar);
  if (!hasAvatar) missingBasicInfoFields.push("avatar");

  const hasFullName = isFilledText(profile.profile?.fullName || profile.name);
  if (!hasFullName) missingBasicInfoFields.push("fullName");

  const hasTitle = isFilledText(profile.profile?.title);
  if (!hasTitle) missingBasicInfoFields.push("title");

  const hasBio = isFilledText(profile.profile?.bio);
  if (!hasBio) missingBasicInfoFields.push("bio");

  const hasContactEmail = isFilledText(profile.profile?.contactEmail || profile.email);
  if (!hasContactEmail) missingBasicInfoFields.push("contactEmail");

  const hasContactPhone = isFilledText(profile.profile?.contactPhone || profile.phone);
  if (!hasContactPhone) missingBasicInfoFields.push("contactPhone");

  const hasLocation = hasNonEmptyArrayItem(profile.profile?.locations) || isFilledText(profile.profile?.location);
  if (!hasLocation) missingBasicInfoFields.push("location");

  const completionItems: ProfileCompletionItem[] = [
    {
      key: "basicInfo",
      label: "Thông tin cơ bản",
      completed: missingBasicInfoFields.length === 0,
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
