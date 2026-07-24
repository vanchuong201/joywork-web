import api from "@/lib/api";

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
    activatedAt: string | null;
  } | null;
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
