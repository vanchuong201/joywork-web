/**
 * Map raw jobs returned by joywork-api into the card shape consumed by
 * `JobResultsList` in the AI chat widget.
 *
 * Two sources are supported:
 * - Semantic search (`POST /api/jobs/semantic-search`) returns a flat
 *   shape with `companyId`, `companyName`, `companySlug`, etc.
 * - Keyword search fallback (`GET /api/jobs`) returns a nested shape with
 *   a `company` object.
 */

export type ChatJobCard = {
  id: string;
  title: string;
  slug?: string | null;
  locations?: string[];
  remote?: boolean;
  employmentType?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  benefitsIncome?: string | null;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    isGood?: boolean;
    legalName?: string | null;
  };
};

type SemanticJobInput = {
  id: string;
  title: string;
  slug?: string | null;
  locations?: string[];
  remote?: boolean;
  employmentType?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  benefitsIncome?: string | null;
  companyId: string;
  companyName: string;
  companySlug: string;
  companyLegalName?: string | null;
  logoUrl?: string | null;
  isGood?: boolean;
};

type KeywordJobInput = {
  id: string;
  title: string;
  slug?: string | null;
  locations?: string[];
  remote?: boolean;
  employmentType?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string;
  benefitsIncome?: string | null;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    isGood?: boolean;
    legalName?: string | null;
  };
};

export function mapSemanticJobsToCards(jobs: SemanticJobInput[] = []): ChatJobCard[] {
  return jobs.map(j => ({
    id: j.id,
    title: j.title,
    slug: j.slug ?? null,
    locations: j.locations ?? [],
    remote: j.remote ?? false,
    employmentType: j.employmentType,
    salaryMin: j.salaryMin ?? null,
    salaryMax: j.salaryMax ?? null,
    currency: j.currency,
    benefitsIncome: j.benefitsIncome ?? null,
    company: {
      id: j.companyId,
      name: j.companyName,
      slug: j.companySlug,
      logoUrl: j.logoUrl ?? null,
      isGood: j.isGood,
      legalName: j.companyLegalName ?? null,
    },
  }));
}

export function mapKeywordJobsToCards(jobs: KeywordJobInput[] = []): ChatJobCard[] {
  return jobs.map(j => ({
    id: j.id,
    title: j.title,
    slug: j.slug ?? null,
    locations: j.locations ?? [],
    remote: j.remote ?? false,
    employmentType: j.employmentType,
    salaryMin: j.salaryMin ?? null,
    salaryMax: j.salaryMax ?? null,
    currency: j.currency,
    benefitsIncome: j.benefitsIncome ?? null,
    company: {
      id: j.company.id,
      name: j.company.name,
      slug: j.company.slug,
      logoUrl: j.company.logoUrl ?? null,
      isGood: j.company.isGood,
      legalName: j.company.legalName ?? null,
    },
  }));
}
