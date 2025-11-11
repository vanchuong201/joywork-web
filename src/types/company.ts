export type CompanyMetric = {
  id?: string;
  label: string;
  value: string;
  description?: string;
  icon?: string;
};

export type CompanyStoryStat = {
  id?: string;
  label: string;
  value: string;
  description?: string;
};

export type CompanyStoryMediaItem = {
  id?: string;
  url: string;
  caption?: string;
};

export type CompanyStoryBlock =
  | {
      id?: string;
      type: "text";
      title?: string;
      subtitle?: string;
      body?: string;
    }
  | {
      id?: string;
      type: "list";
      title?: string;
      subtitle?: string;
      items: string[];
    }
  | {
      id?: string;
      type: "quote";
      title?: string;
      quote: {
        text: string;
        author?: string;
        role?: string;
      };
    }
  | {
      id?: string;
      type: "stats";
      title?: string;
      subtitle?: string;
      stats: CompanyStoryStat[];
    }
  | {
      id?: string;
      type: "media";
      title?: string;
      subtitle?: string;
      media: CompanyStoryMediaItem[];
    };

export type CompanyHighlight = {
  id?: string;
  label: string;
  description?: string;
};

export type CompanyProfile = {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  website?: string | null;
  location?: string | null;
  industry?: string | null;
  size?: string | null;
  foundedYear?: number | null;
  headcount?: number | null;
  headcountNote?: string | null;
  metrics?: CompanyMetric[] | null;
  profileStory?: CompanyStoryBlock[] | null;
  highlights?: CompanyHighlight[] | null;
  stats?: {
    posts: number;
    jobs: number;
    followers: number;
  } | null;
};

