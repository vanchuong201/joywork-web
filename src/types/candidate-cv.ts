import type { UserEducation, UserExperience, UserProfile } from "@/types/user";

export const CV_NAME_MAX_LENGTH = 60;

export interface CvReadiness {
  isReady: boolean;
  missingSections: string[];
  hasBasicInfo?: boolean;
  hasKsa?: boolean;
  hasExperiences?: boolean;
}

export interface CandidateCvSummary {
  id: string;
  name: string;
  isDefault: boolean;
  title?: string | null;
  avatar?: string | null;
  readiness: CvReadiness;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateCvList {
  cvs: CandidateCvSummary[];
  limit: number;
  defaultCvId: string | null;
}

type CvContent = Omit<
  UserProfile,
  "id" | "userId" | "status" | "isPublic" | "isSearchingJob" | "allowCvFlip" | "createdAt" | "updatedAt"
>;

export interface CandidateCvDetail extends CvContent {
  id: string;
  name: string;
  isDefault: boolean;
  readiness: CvReadiness;
  experiences: UserExperience[];
  educations: UserEducation[];
  createdAt: string;
  updatedAt: string;
}

export interface JobSearchSettings {
  isSearchingJob: boolean;
  allowCvFlip: boolean;
  defaultCvId: string | null;
}

export interface OwnAccount {
  id: string;
  email: string;
  emailVerified?: boolean;
  name?: string | null;
  slug?: string | null;
  avatar?: string | null;
  phone?: string | null;
  role: string;
  createdAt: string;
}
