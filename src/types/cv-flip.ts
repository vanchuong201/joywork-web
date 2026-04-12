export type CvFlipCompanyAccess = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  role: string;
  isPremium: boolean;
  cvFlipEnabled: boolean;
  monthlyTotalLimit: number;
  monthlyRequestLimit: number;
};

export type CvFlipUsage = {
  total: {
    used: number;
    limit: number;
    remaining: number;
  };
  request: {
    used: number;
    limit: number;
    remaining: number;
  };
  month: number;
  year: number;
};

export type CvFlipCandidateCard = {
  userId: string;
  slug: string | null;
  name: string | null;
  avatar: string | null;
  headline: string | null;
  skills: string[];
  locations: string[];
};

export type CvFlipCandidatesResponse = {
  candidates: CvFlipCandidateCard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CvFlipRequestItem = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  expiresAt: string;
  createdAt: string;
  respondedAt: string | null;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    website: string | null;
  };
};
