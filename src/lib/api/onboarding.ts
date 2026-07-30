import api from "@/lib/api";
import type { CvImportStatus } from "@/types/cv-import";

export type OnboardingTokenStatus = "VALID" | "EXPIRED" | "USED" | "INVALID";

export interface OnboardingTokenStatusResponse {
  status: OnboardingTokenStatus;
  expiresAt?: string;
  usedAt?: string;
  user?: {
    name: string | null;
  };
}

export interface OnboardingActivateResponse {
  message: string;
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

export type CandidateCvStatus =
  | "CV_EMPTY"
  | "CV_MANUAL_PENDING"
  | "CV_AUTO_QUEUED"
  | "CV_AUTO_PROCESSING"
  | "CV_AUTO_READY"
  | "CV_AUTO_FAILED"
  | "CV_APPLIED";

export interface OnboardingMeResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    profile: {
      fullName: string | null;
      title: string | null;
      contactEmail: string | null;
      contactPhone: string | null;
      locations: string[];
      wardCodes: string[];
      linkedin: string | null;
    } | null;
  };
  importRecord: {
    id: string;
    rawName: string | null;
    rawPhone: string | null;
    rawProvince: string | null;
    rawDistrict: string | null;
    rawPosition: string | null;
    rawSalary: string | null;
    rawExperience: string | null;
    rawSocialLink: string | null;
    rawCvLink: string | null;
    rawPortfolioLink: string | null;
    cvLinkType: string;
    linkAction?: string;
    activatedAt: string | null;
  } | null;
  cvImport: {
    jobId: string;
    status: CvImportStatus;
    errorMessage: string | null;
  } | null;
  cvStatus: CandidateCvStatus | null;
}

export const onboardingApi = {
  async getTokenStatus(token: string): Promise<OnboardingTokenStatusResponse> {
    const { data } = await api.get<{ data: OnboardingTokenStatusResponse }>(`/api/onboarding/token/${encodeURIComponent(token)}`);
    return data.data;
  },

  async activate(payload: { token: string; password: string }): Promise<OnboardingActivateResponse> {
    const { data } = await api.post<{ data: OnboardingActivateResponse }>("/api/onboarding/activate", payload);
    return data.data;
  },

  async resend(payload: { email: string }): Promise<{ message: string }> {
    const { data } = await api.post<{ data: { message: string } }>("/api/onboarding/resend", payload);
    return data.data;
  },

  async getMe(): Promise<OnboardingMeResponse> {
    const { data } = await api.get<{ data: OnboardingMeResponse }>("/api/onboarding/me");
    return data.data;
  },
};
