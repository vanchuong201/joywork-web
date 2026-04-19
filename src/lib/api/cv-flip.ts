import api from "@/lib/api";
import type {
  CvFlipCandidatesResponse,
  CvFlipCompanyAccess,
  CvFlipRequestItem,
  CvFlipUsage,
} from "@/types/cv-flip";

export async function getCvFlipAccessCompanies(): Promise<CvFlipCompanyAccess[]> {
  const res = await api.get("/api/cv-flip/check-access");
  return res.data.data.companies ?? [];
}

export async function getCvFlipUsage(companyId: string): Promise<CvFlipUsage> {
  const res = await api.get("/api/cv-flip/usage", {
    params: { companyId },
  });
  return res.data.data;
}

export async function listCvFlipCandidates(params: {
  page: number;
  limit: number;
  keyword?: string;
  skills?: string[];
  locations?: string[];
  ward?: string;
  education?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: "VND" | "USD";
  workMode?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  yearOfBirthMin?: number;
  yearOfBirthMax?: number;
  educationLevel?: "NONE" | "HIGH_SCHOOL" | "COLLEGE" | "BACHELOR" | "MASTER" | "PHD" | "TRAINING_CENTER";
}): Promise<CvFlipCandidatesResponse> {
  const searchParams: Record<string, string | number> = {
    page: params.page,
    limit: params.limit,
  };

  if (params.keyword) searchParams.keyword = params.keyword;
  if (params.skills && params.skills.length > 0) searchParams.skills = params.skills.join(",");
  if (params.locations && params.locations.length > 0) searchParams.locations = params.locations.join(",");
  if (params.ward) searchParams.ward = params.ward;
  if (params.education) searchParams.education = params.education;
  if (params.salaryMin !== undefined) searchParams.salaryMin = params.salaryMin;
  if (params.salaryMax !== undefined) searchParams.salaryMax = params.salaryMax;
  if (params.salaryCurrency) searchParams.salaryCurrency = params.salaryCurrency;
  if (params.workMode) searchParams.workMode = params.workMode;
  if (params.gender) searchParams.gender = params.gender;
  if (params.yearOfBirthMin !== undefined) searchParams.yearOfBirthMin = params.yearOfBirthMin;
  if (params.yearOfBirthMax !== undefined) searchParams.yearOfBirthMax = params.yearOfBirthMax;
  if (params.educationLevel) searchParams.educationLevel = params.educationLevel;

  const res = await api.get("/api/cv-flip/candidates", { params: searchParams });
  return res.data.data;
}

export async function getCvFlipCandidateDetail(slug: string, companyId?: string) {
  const res = await api.get(`/api/cv-flip/candidates/${encodeURIComponent(slug)}`, {
    params: companyId ? { companyId } : {},
  });
  return res.data.data as {
    candidate: {
      userId: string;
      slug: string | null;
      name: string | null;
      profile: {
        contactEmail: string | null;
        contactPhone: string | null;
        cvUrl: string | null;
      };
    };
    access: {
      isFlipped: boolean;
      hasPendingRequest: boolean;
      connectionId: string | null;
      flippedAt: string | null;
      isOwnerView?: boolean;
      companyContext?: boolean;
    };
  };
}

export async function flipCandidate(companyId: string, candidateUserId: string) {
  const res = await api.post("/api/cv-flip/flip", {
    companyId,
    candidateUserId,
  });
  return res.data.data;
}

export async function listMyCvFlipRequests(params: { page?: number; limit?: number }) {
  const res = await api.get("/api/cv-flip/requests", {
    params: { page: params.page ?? 1, limit: params.limit ?? 20 },
  });
  return res.data.data as {
    requests: CvFlipRequestItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
}

export async function respondMyCvFlipRequest(requestId: string, action: "approve" | "reject") {
  const res = await api.post(`/api/cv-flip/requests/${requestId}/respond`, { action });
  return res.data.data;
}
