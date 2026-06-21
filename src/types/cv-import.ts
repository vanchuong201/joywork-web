export const CV_IMPORT_SECTIONS = [
  "basicInfo",
  "contact",
  "skills",
  "knowledge",
  "attitude",
  "careerGoals",
  "expectations",
  "experiences",
  "educations",
] as const;

export type CvImportSection = (typeof CV_IMPORT_SECTIONS)[number];

export type CvImportApplyMode = "fill_missing" | "overwrite";

export type CvImportStatus =
  | "PENDING"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "APPLIED";

export interface ParsedCvBasicInfo {
  fullName?: string | null;
  title?: string | null;
  headline?: string | null;
  bio?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  yearOfBirth?: number | null;
}

export interface ParsedCvContact {
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  linkedin?: string | null;
  github?: string | null;
}

export interface ParsedCvExpectations {
  expectedSalaryMin?: number | null;
  expectedSalaryMax?: number | null;
  salaryCurrency?: "VND" | "USD" | null;
  workMode?: string | null;
}

export interface ParsedCvExperience {
  role: string | null;
  company: string | null;
  startDate: string | null;
  endDate: string | null;
  period: string | null;
  desc: string | null;
  achievements: string[];
}

export interface ParsedCvEducation {
  school: string | null;
  degree: string | null;
  startDate: string | null;
  endDate: string | null;
  period: string | null;
  gpa: string | null;
  honors: string | null;
}

export interface ParsedCv {
  basicInfo: ParsedCvBasicInfo;
  contact: ParsedCvContact;
  skills: string[];
  knowledge: string[];
  attitude: string[];
  careerGoals: string[];
  expectations: ParsedCvExpectations;
  experiences: ParsedCvExperience[];
  educations: ParsedCvEducation[];
  warnings: string[];
  confidence: number | null;
}

export interface CvImportJob {
  id: string;
  status: CvImportStatus;
  fileName: string | null;
  fileType: string | null;
  sourceCvUrl: string | null;
  confidence: number | null;
  warnings: string[];
  parsedData: ParsedCv | null;
  applyMode: CvImportApplyMode | null;
  appliedSections: CvImportSection[];
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  appliedAt: string | null;
}
