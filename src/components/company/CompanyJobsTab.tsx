"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Calendar, List, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  jobs: any[];
  companyName: string;
  companyLogoUrl?: string | null;
};

type ViewMode = "list" | "grid";

export default function CompanyJobsTab({ jobs, companyName, companyLogoUrl }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20 bg-[var(--card)] rounded-3xl border border-[var(--border)] shadow-sm">
        <div className="w-16 h-16 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--muted-foreground)]">
          <Briefcase className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">Chưa có tin tuyển dụng nào</h3>
        <p className="text-[var(--muted-foreground)]">Công ty chưa đăng tải tin tuyển dụng nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-[var(--foreground)]">Tin tuyển dụng</h3>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Tổng cộng {jobs.length} vị trí đang tuyển</p>
        </div>
        {/* View Mode Toggle - Only for public view */}
        {jobs.length > 0 && (
          <div className="flex items-center gap-2 border border-[var(--border)] rounded-lg p-1 bg-[var(--card)]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn("h-8 px-3", viewMode === "list" && "bg-[var(--muted)]")}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn("h-8 px-3", viewMode === "grid" && "bg-[var(--muted)]")}
            >
              <Grid className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Jobs List/Grid */}
      {viewMode === "list" ? (
        <div className="space-y-4">
          {jobs.map((job: any) => (
            <Link href={`/jobs/${job.id}`} key={job.id} className="block group">
              <Card className="hover:border-[var(--brand)]/50 transition-colors">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg mb-2 text-[var(--foreground)] group-hover:text-[var(--brand)] transition-colors truncate">
                            {job.title}
                          </h4>
                          <div className="flex flex-wrap gap-3 text-sm text-[var(--muted-foreground)] items-center">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {job.location || "Remote"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" /> {translateEmploymentType(job.employmentType)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {formatDate(job.createdAt)}
                            </span>
                          </div>
                        </div>
                        {companyLogoUrl && (
                          <div className="w-12 h-12 relative bg-[var(--card)] rounded-lg border border-[var(--border)] p-1 flex-shrink-0">
                            <Image src={companyLogoUrl} alt={companyName} fill className="object-contain p-1" />
                          </div>
                        )}
                      </div>
                      {job.tags && job.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {job.tags.slice(0, 5).map((tag: string) => (
                            <Badge key={tag} className="bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]/80 border-0 font-normal text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {job.tags.length > 5 && (
                            <Badge className="bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-0 font-normal text-xs">
                              +{job.tags.length - 5}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job: any) => (
            <Link href={`/jobs/${job.id}`} key={job.id} className="block group">
              <Card className="hover:border-[var(--brand)]/50 transition-colors h-full">
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-lg text-[var(--foreground)] group-hover:text-[var(--brand)] transition-colors line-clamp-2 flex-1">
                      {job.title}
                    </h4>
                    {companyLogoUrl && (
                      <div className="w-10 h-10 relative bg-[var(--card)] rounded-lg border border-[var(--border)] p-1 flex-shrink-0">
                        <Image src={companyLogoUrl} alt={companyName} fill className="object-contain p-1" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm text-[var(--muted-foreground)]">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{job.location || "Remote"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      <span>{translateEmploymentType(job.employmentType)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                  {job.tags && job.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                      {job.tags.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-0 font-normal text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {job.tags.length > 3 && (
                        <Badge className="bg-slate-50 text-slate-500 border-0 font-normal text-xs">
                          +{job.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function translateEmploymentType(type?: string) {
  switch (type) {
    case "FULL_TIME":
      return "Toàn thời gian";
    case "PART_TIME":
      return "Bán thời gian";
    case "CONTRACT":
      return "Hợp đồng";
    case "INTERNSHIP":
      return "Thực tập";
    case "FREELANCE":
      return "Tự do";
    default:
      return type ?? "";
  }
}

