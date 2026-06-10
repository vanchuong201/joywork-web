"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { List, Grid, ChevronLeft, ChevronRight, Building2, X } from "lucide-react";
import { CompanyAvatar } from "@/components/company/CompanyAvatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CompanyHoverCard from "@/components/company/CompanyHoverCard";
import Link from "next/link";
import { buildJobUrl } from "@/lib/job-url";
import { getProvinceNameByCode } from "@/lib/provinces";

const formatSalary = (job: any) => {
    if (job.salaryMin || job.salaryMax) {
      if (job.salaryMin && job.salaryMax) {
        return `${job.salaryMin.toLocaleString("vi-VN")} - ${job.salaryMax.toLocaleString("vi-VN")} ${job.currency || "VND"}`;
      } else if (job.salaryMin) {
        return `${job.salaryMin.toLocaleString("vi-VN")} ${job.currency || "VND"}`;
      } else if (job.salaryMax) {
        return `${job.salaryMax.toLocaleString("vi-VN")} ${job.currency || "VND"}`;
      }
    }
    return job.benefitsIncome || "Thương lượng";
  };

  const translateEmploymentType = (type: string) => {
    switch (type) {
      case "FULL_TIME":
        return "Toàn thời gian";
      case "PART_TIME":
        return "Bán thời gian";
      case "CONTRACT":
        return "Hợp đồng thời vụ";
      case "INTERNSHIP":
        return "Thực tập";
      case "REMOTE":
        return "Làm việc từ xa (Remote)";
      default:
        return type;
    }
  };

  const formatLocation = (job: any) => {
      const employmentLabel = job.employmentType ? translateEmploymentType(job.employmentType) : null;
      
      if (job.remote) {
        return employmentLabel ? `${employmentLabel} - Làm việc từ xa` : "Làm việc từ xa";
      }
      
      let locationStr = "";
      if (job.locations && job.locations.length > 0) {
        const firstLoc = job.locations[0];
        const provinceName = getProvinceNameByCode(firstLoc);
        if (job.locations.length === 1) {
          locationStr = provinceName || firstLoc;
        } else {
          locationStr = `${provinceName || firstLoc} +${job.locations.length - 1}`;
        }
      } else if (job.location) {
        locationStr = job.location;
      }
      
      if (employmentLabel && locationStr) {
        return `${employmentLabel} - ${locationStr}`;
      }
      if (employmentLabel) return employmentLabel;
      if (locationStr) return locationStr;
      return "Không ghi rõ";
    };

export function JobResultsList({ jobs }: { jobs: any[] }) {
  if (!jobs || jobs.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">Không tìm thấy việc làm phù hợp.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-1">
      {jobs.map(j => (
        <Card
          key={j.id}
          className="bg-white/70 border border-[var(--border)] hover:border-[var(--brand)]/40 transition-colors"
        >
          <CardContent className="p-4">
            <div className="flex gap-3">
              {/* Company Avatar */}
              <CompanyAvatar
                logoUrl={j.company.logoUrl}
                isGood={j.company.isGood}
                name={j.company.name}
                size={64}
                shape="square"
                imgClassName="object-cover"
                fallback={
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
                    <Building2 className="h-8 w-8" />
                  </div>
                }
              />
              {/* Job Info */}
              <div className="flex-1 min-w-0 space-y-1">
                {/* Job Title with Tooltip */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3
                      className="text-base font-semibold text-[var(--foreground)] line-clamp-1 cursor-pointer hover:text-[var(--brand)] transition-colors"
                      onClick={() => window.open(buildJobUrl(j), "_blank", "noopener,noreferrer")}
                    >
                      {j.title}
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{j.title}</p>
                  </TooltipContent>
                </Tooltip>
                {/* Company Legal Name with HoverCard and Link */}
                <CompanyHoverCard companyId={j.company.id} slug={j.company.slug} companyName={j.company.name}>
                  <Link
                    href={`/companies/${j.company.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-[var(--muted-foreground)] line-clamp-1 hover:text-[var(--brand)] hover:underline"
                  >
                    {j.company.legalName || j.company.name}
                  </Link>
                </CompanyHoverCard>
                <p className="text-xs font-medium text-red-600 line-clamp-1">
                  {formatSalary(j)}
                </p>
                <p className="text-xs text-[var(--muted-foreground)] line-clamp-1">
                  {formatLocation(j)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
