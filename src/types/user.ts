export type UserStatus = 'OPEN_TO_WORK' | 'NOT_AVAILABLE' | 'LOOKING';

export interface UserExperience {
  id: string;
  role: string;
  company: string;
  startDate?: string | null;
  endDate?: string | null;
  period?: string | null;
  desc?: string | null;
  achievements: string[];
  order: number;
}

export interface UserEducation {
  id: string;
  school: string;
  degree: string;
  startDate?: string | null;
  endDate?: string | null;
  period?: string | null;
  gpa?: string | null;
  honors?: string | null;
  order: number;
}

export interface UserProfileVisibility {
  bio?: boolean;
  experience?: boolean;
  education?: boolean;
  ksa?: boolean;
  expectations?: boolean;
}

export interface UserProfile {
  id: string;
  userId: string;
  avatar?: string | null;
  fullName?: string | null;
  title?: string | null;
  headline?: string | null;
  bio?: string | null;
  skills: string[];
  cvUrl?: string | null;
  location?: string | null;
  website?: string | null;
  linkedin?: string | null;
  github?: string | null;
   // CV contact info (independent from account email/phone)
   contactEmail?: string | null;
   contactPhone?: string | null;
  status?: UserStatus | null;
  isPublic?: boolean;
  visibility?: UserProfileVisibility | null;
  knowledge?: string[];
  attitude?: string[];
  expectedSalary?: string | null;
  workMode?: string | null;
  expectedCulture?: string | null;
  careerGoals?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicUserProfile {
  id: string;
  name?: string | null;
  slug?: string | null;
  createdAt: string;
  profile?: {
    id: string;
    avatar?: string | null;
    fullName?: string | null;
    title?: string | null;
    headline?: string | null;
    location?: string | null;
    website?: string | null;
    linkedin?: string | null;
    github?: string | null;
    status?: UserStatus | null;
    bio?: string | null;
    knowledge?: string[];
    skills?: string[];
    attitude?: string[];
    expectedSalary?: string | null;
    workMode?: string | null;
    expectedCulture?: string | null;
    careerGoals?: string[];
    visibility?: UserProfileVisibility | null;
  };
  experiences?: UserExperience[];
  educations?: UserEducation[];
}

export interface OwnUserProfile extends PublicUserProfile {
  email: string;
  phone?: string | null;
  avatar?: string | null; // Account avatar (User.avatar)
  profile?: UserProfile;
}

