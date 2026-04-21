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
  title: string | null;
  skills: string[];
  locations: string[];
  wardCodes?: string[];
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  salaryCurrency: string | null;
  workMode: string | null;
  gender: string | null;
  yearOfBirth: number | null;
  educationLevel: string | null;
  experiences: CvFlipCandidateExperience[];
  educations: CvFlipCandidateEducation[];
};

export type CvFlipCandidateExperience = {
  id: string;
  role: string;
  company: string;
  period: string | null;
  desc: string | null;
  achievements: string[];
  order: number;
};

export type CvFlipCandidateEducation = {
  id: string;
  school: string;
  degree: string;
  period: string | null;
  gpa: string | null;
  honors: string | null;
  order: number;
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
