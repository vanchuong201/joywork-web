export interface CompanyMetric {
  id?: string;
  label: string;
  value: string;
  description?: string;
  icon?: string;
}

export interface CompanyStoryStat {
  id?: string;
  label: string;
  value: string;
  description?: string;
}

export interface CompanyStoryMediaItem {
  id?: string;
  url: string;
  caption?: string;
}

export interface CompanyStoryBlock {
  id?: string;
  type: 'text' | 'list' | 'quote' | 'stats' | 'media';
  title?: string;
  subtitle?: string;
  body?: string;
  items?: string[];
  stats?: CompanyStoryStat[];
  quote?: {
    text: string;
    author?: string;
    role?: string;
  };
  media?: CompanyStoryMediaItem[];
}

export interface CompanyHighlight {
  id?: string;
  label: string;
  description?: string;
}

export interface CompanyProfileData {
  stats?: Array<{ value: string; label: string; trend?: string; icon?: string }>;
  vision?: string;
  mission?: string;
  coreValues?: string;
  products?: any; 
  recruitmentPrinciples?: any;
  benefits?: any;
  hrJourney?: any;
  careerPath?: any;
  salaryAndBonus?: any;
  training?: any;
  leaders?: any;
  story?: any;
  culture?: any;
  awards?: any;
}

export interface Company {
  id: string;
  name: string;
  legalName?: string | null;
  slug: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  website?: string;
  location?: string;
  industry?: string;
  size?: string;
  foundedYear?: number;
  headcount?: number;
  headcountNote?: string;
  metrics?: CompanyMetric[];
  profileStory?: CompanyStoryBlock[];
  highlights?: CompanyHighlight[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  members?: Array<{
    id: string;
    userId: string;
    role: string;
    joinedAt: string;
    user: {
      id: string;
      email: string;
      name?: string;
      avatar?: string;
    };
  }>;
  stats?: {
    posts: number;
    jobs: number;
    followers: number;
  };
  profile?: CompanyProfileData;
}

