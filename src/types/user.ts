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
  locations?: string[];
  wardCodes?: string[];
  specificAddress?: string | null;
  website?: string | null;
  linkedin?: string | null;
  github?: string | null;
   // CV contact info (independent from account email/phone)
   contactEmail?: string | null;
   contactPhone?: string | null;
  status?: UserStatus | null;
  isPublic?: boolean;
  isSearchingJob?: boolean;
  allowCvFlip?: boolean;
  visibility?: UserProfileVisibility | null;
  knowledge?: string[];
  attitude?: string[];
  expectedSalaryMin?: number | null;
  expectedSalaryMax?: number | null;
  salaryCurrency?: string | null;
  workMode?: string | null;
  expectedCulture?: string | null;
  careerGoals?: string[];
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  dayOfBirth?: number | null;
  monthOfBirth?: number | null;
  yearOfBirth?: number | null;
  educationLevel?: 'TRAINING_CENTER' | 'INTERMEDIATE' | 'COLLEGE' | 'BACHELOR' | 'MASTER' | 'PHD' | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicUserProfile {
  id: string;
  name?: string | null;
  slug?: string | null;
  isTalentPoolMember?: boolean;
  createdAt: string;
  profile?: {
    id: string;
    avatar?: string | null;
    fullName?: string | null;
    title?: string | null;
    headline?: string | null;
    location?: string | null;
    locations?: string[];
    wardCodes?: string[];
    specificAddress?: string | null;
    website?: string | null;
    linkedin?: string | null;
    github?: string | null;
    cvUrl?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    status?: UserStatus | null;
    isSearchingJob?: boolean;
    allowCvFlip?: boolean;
    bio?: string | null;
    knowledge?: string[];
    skills?: string[];
    attitude?: string[];
    expectedSalaryMin?: number | null;
    expectedSalaryMax?: number | null;
    salaryCurrency?: string | null;
    workMode?: string | null;
    expectedCulture?: string | null;
    careerGoals?: string[];
    visibility?: UserProfileVisibility | null;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
    dayOfBirth?: number | null;
    monthOfBirth?: number | null;
    yearOfBirth?: number | null;
    educationLevel?: 'TRAINING_CENTER' | 'INTERMEDIATE' | 'COLLEGE' | 'BACHELOR' | 'MASTER' | 'PHD' | null;
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

