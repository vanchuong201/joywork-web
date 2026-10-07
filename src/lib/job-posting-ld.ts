import { getProvinceNameByCode } from "@/lib/provinces";
import { buildJobUrl } from "@/lib/job-url";
import { formatDateUTC } from "@/lib/utils";
import { getPublicSiteUrl } from "@/lib/seo-url-metadata";

export type JobPostingSource = {
  id: string;
  title: string;
  slug?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
  location?: string | null;
  locations?: string[];
  remote?: boolean | null;
  employmentType?: string | null;
  isActive?: boolean | null;
  applicationDeadline?: string | null;
  createdAt?: string | null;
  company: {
    name: string;
    slug: string;
    legalName?: string | null;
    website?: string | null;
    logoUrl?: string | null;
  };
};

const EMPLOYMENT_TYPE: Record<string, string> = {
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  CONTRACT: "CONTRACTOR",
  INTERNSHIP: "INTERN",
  REMOTE: "TELECOMMUTE",
};

export function isJobClosed(job: Pick<JobPostingSource, "isActive" | "applicationDeadline">, now = new Date()): boolean {
  if (job.isActive === false) return true;
  if (!job.applicationDeadline) return false;
  const deadline = new Date(job.applicationDeadline);
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() < now.getTime();
}

function positiveAmount(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function salaryLabel(job: JobPostingSource): string {
  const min = positiveAmount(job.salaryMin);
  const max = positiveAmount(job.salaryMax);
  const currency = job.currency === "USD" ? "USD" : "VND";
  if (min && max) return `${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} ${currency}`;
  if (min) return `${min.toLocaleString("vi-VN")} ${currency}`;
  if (max) return `${max.toLocaleString("vi-VN")} ${currency}`;
  return "";
}

function locationLabel(job: JobPostingSource): string {
  if (job.location?.trim()) return job.location.trim();
  const names = (job.locations ?? [])
    .map((code) => getProvinceNameByCode(code) || code)
    .map((name) => name.trim())
    .filter(Boolean);
  return names.join(", ");
}

export function buildJobPostingLd(job: JobPostingSource, siteUrl = getPublicSiteUrl(), now = new Date()) {
  if (isJobClosed(job, now) || !job.createdAt) return null;

  const salary = salaryLabel(job);
  const location = locationLabel(job);
  const deadlineLabel = job.applicationDeadline ? formatDateUTC(job.applicationDeadline) : "";
  const description = [job.company.name, job.title, salary, location, deadlineLabel].filter(Boolean).join(". ");
  const mappedEmployment = job.employmentType ? EMPLOYMENT_TYPE[job.employmentType] : undefined;
  const remote = job.remote === true || mappedEmployment === "TELECOMMUTE";
  const min = positiveAmount(job.salaryMin);
  const max = positiveAmount(job.salaryMax);

  const hiringOrganization: Record<string, unknown> = {
    "@type": "Organization",
    name: job.company.name,
  };
  if (job.company.website?.startsWith("http")) hiringOrganization.sameAs = job.company.website;
  if (job.company.logoUrl?.startsWith("http")) hiringOrganization.logo = job.company.logoUrl;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    datePosted: job.createdAt,
    directApply: true,
    identifier: {
      "@type": "PropertyValue",
      name: "JOYWORK",
      value: job.id,
    },
    hiringOrganization,
    url: `${siteUrl}${buildJobUrl({ id: job.id, slug: job.slug, title: job.title })}`,
  };

  if (job.applicationDeadline) data.validThrough = job.applicationDeadline;

  if (remote) {
    data.jobLocationType = "TELECOMMUTE";
    data.applicantLocationRequirements = { "@type": "Country", name: "Vietnam" };
    data.employmentType = mappedEmployment && mappedEmployment !== "TELECOMMUTE" ? [mappedEmployment, "TELECOMMUTE"] : "TELECOMMUTE";
  } else {
    if (mappedEmployment) data.employmentType = mappedEmployment;
    if (location) {
      data.jobLocation = {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: location,
          addressCountry: "VN",
        },
      };
    }
  }

  if (min || max) {
    data.baseSalary = {
      "@type": "MonetaryAmount",
      currency: job.currency === "USD" ? "USD" : "VND",
      value: {
        "@type": "QuantitativeValue",
        ...(min ? { minValue: min } : {}),
        ...(max ? { maxValue: max } : {}),
        unitText: "MONTH",
      },
    };
  }

  return data;
}

export function buildOrganizationGraph(siteUrl = getPublicSiteUrl()) {
  const home = `${siteUrl}/`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "JOYWORK",
        legalName: "Công Ty Cổ Phần JOYWORK",
        url: home,
        logo: `${siteUrl}/joywork-logo-1024.png`,
        sameAs: [
          "https://www.facebook.com/joywork",
          "https://www.tiktok.com/@joywork.vn",
          "https://www.linkedin.com/company/joywork-official/",
        ],
      },
      {
        "@type": "WebSite",
        name: "JOYWORK",
        url: home,
        publisher: { "@type": "Organization", name: "JOYWORK", url: home },
      },
    ],
  };
}
