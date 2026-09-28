"use client";

import { useMemo } from "react";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import {
  getCandidateCv,
  getJobSearchSettings,
  getOwnAccount,
  listCandidateCvs,
} from "@/lib/api/candidate-cvs";
import type { CandidateCvDetail, OwnAccount } from "@/types/candidate-cv";
import type { OwnUserProfile } from "@/types/user";

export const candidateCvKeys = {
  list: ["candidate-cvs"] as const,
  detail: (cvId: string) => ["candidate-cv", cvId] as const,
  settings: ["job-search-settings"] as const,
  account: ["account"] as const,
};

type QueryOptions = { enabled?: boolean; staleTime?: number };

export function useCandidateCvList(options?: QueryOptions) {
  return useQuery({
    queryKey: candidateCvKeys.list,
    queryFn: listCandidateCvs,
    enabled: options?.enabled ?? true,
    ...(options?.staleTime !== undefined ? { staleTime: options.staleTime } : {}),
  });
}

export function useCandidateCv(cvId: string | null | undefined, options?: Pick<QueryOptions, "staleTime">) {
  return useQuery({
    queryKey: candidateCvKeys.detail(cvId ?? ""),
    queryFn: () => getCandidateCv(cvId as string),
    enabled: Boolean(cvId),
    ...(options?.staleTime !== undefined ? { staleTime: options.staleTime } : {}),
  });
}

export function useJobSearchSettings(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: candidateCvKeys.settings,
    queryFn: getJobSearchSettings,
    enabled: options?.enabled ?? true,
  });
}

export function useOwnAccount(options?: QueryOptions) {
  return useQuery({
    queryKey: candidateCvKeys.account,
    queryFn: getOwnAccount,
    enabled: options?.enabled ?? true,
    ...(options?.staleTime !== undefined ? { staleTime: options.staleTime } : {}),
  });
}

/** CV mặc định dưới dạng `OwnUserProfile` (header, readiness...). */
export function useDefaultCvProfile(options?: QueryOptions) {
  const enabled = options?.enabled ?? true;
  const listQuery = useCandidateCvList(options);
  const defaultCvId = enabled ? listQuery.data?.defaultCvId : null;
  const cvQuery = useCandidateCv(defaultCvId, options);
  const accountQuery = useOwnAccount(options);

  const profile = useMemo(
    () => (cvQuery.data ? toOwnUserProfile(cvQuery.data, accountQuery.data) : undefined),
    [cvQuery.data, accountQuery.data],
  );

  return {
    profile,
    defaultCv: cvQuery.data,
    isLoading: enabled && (listQuery.isLoading || (Boolean(defaultCvId) && cvQuery.isLoading)),
  };
}

/** Sau khi sửa nội dung một CV: làm mới chi tiết CV đó + danh sách (readiness, updatedAt). */
export function invalidateCandidateCv(queryClient: QueryClient, cvId?: string) {
  if (cvId) {
    void queryClient.invalidateQueries({ queryKey: candidateCvKeys.detail(cvId) });
  } else {
    void queryClient.invalidateQueries({ queryKey: ["candidate-cv"] });
  }
  void queryClient.invalidateQueries({ queryKey: candidateCvKeys.list });
}

/** Map CV + tài khoản sang shape `OwnUserProfile` mà các khối chỉnh sửa hồ sơ đang dùng. */
export function toOwnUserProfile(cv: CandidateCvDetail, account?: OwnAccount | null): OwnUserProfile {
  const { id, name: _cvName, isDefault: _isDefault, readiness: _readiness, experiences, educations, createdAt, updatedAt, ...content } = cv;
  return {
    id: account?.id ?? "",
    email: account?.email ?? "",
    name: account?.name ?? null,
    slug: account?.slug ?? null,
    phone: account?.phone ?? null,
    avatar: account?.avatar ?? null,
    createdAt: account?.createdAt ?? createdAt,
    profile: {
      ...content,
      id,
      userId: account?.id ?? "",
      skills: content.skills ?? [],
      createdAt,
      updatedAt,
    },
    experiences,
    educations,
  };
}
