export type ApplicationStatus =
  | "RECEIVED"
  | "SUITABLE"
  | "INTERVIEW_SCHEDULED"
  | "OFFER_SENT"
  | "HIRED"
  | "NOT_SUITABLE"
  | "NOT_SUITABLE_SAVED";

export interface CvSnapshotExperience {
  id: string;
  role: string;
  company: string;
  startDate: string | null;
  endDate: string | null;
  period: string | null;
  desc: string | null;
  achievements: string[];
  order: number;
}

export interface CvSnapshotEducation {
  id: string;
  school: string;
  degree: string;
  startDate: string | null;
  endDate: string | null;
  period: string | null;
  gpa: string | null;
  honors: string | null;
  order: number;
}

export interface CvSnapshotContent {
  avatar: string | null;
  fullName: string | null;
  title: string | null;
  headline: string | null;
  bio: string | null;
  skills: string[];
  knowledge: string[];
  attitude: string[];
  cvUrl: string | null;
  locations: string[];
  wardCodes: string[];
  specificAddress: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  visibility: Record<string, boolean> | null;
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  salaryCurrency: string | null;
  workMode: string | null;
  expectedCulture: string | null;
  careerGoals: string[];
  gender: string | null;
  dayOfBirth: number | null;
  monthOfBirth: number | null;
  yearOfBirth: number | null;
  educationLevel: string | null;
}

export interface CvSnapshot {
  version: 1;
  source: "apply" | "backfill";
  capturedAt: string;
  cvId: string;
  cvName: string;
  account: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    slug: string | null;
  };
  content: CvSnapshotContent;
  experiences: CvSnapshotExperience[];
  educations: CvSnapshotEducation[];
}

export interface PreviousApplication {
  id: string;
  status: ApplicationStatus | string;
  appliedAt: string;
  sourceCvId: string | null;
  sourceCvName: string | null;
}

export interface ApplicationDetail {
  application: {
    id: string;
    jobId: string;
    userId: string;
    status: ApplicationStatus | string;
    coverLetter?: string | null;
    resumeUrl?: string | null;
    notes?: string | null;
    appliedAt: string;
    updatedAt: string;
    sourceCvId: string | null;
    reapplyIndex: number;
    job: {
      id: string;
      slug?: string | null;
      title: string;
      company: { id: string; name: string; slug: string; logoUrl?: string | null };
    };
  };
  snapshot: CvSnapshot | null;
  previousApplications: PreviousApplication[];
}
