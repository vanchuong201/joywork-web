"use client";

import { useState } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatSalaryRange } from "@/lib/provinces";
import ExperienceEducationModal from "./ExperienceEducationModal";

export type CandidateRowData = {
  userId: string;
  slug: string | null;
  name: string | null;
  avatar: string | null;
  headline: string | null;
  title: string | null;
  skills: string[];
  locations: string[];
  expectedSalaryMin: number | null;
  expectedSalaryMax: number | null;
  salaryCurrency: string | null;
  workMode: string | null;
  experiences: Array<{
    id: string;
    role: string;
    company: string;
    period: string | null;
  }>;
  educations: Array<{
    id: string;
    school: string;
    degree: string;
    period: string | null;
  }>;
  gender?: string | null;
  yearOfBirth?: number | null;
  educationLevel?: string | null;
};

interface CandidateRowProps {
  candidate: CandidateRowData;
}

const MAX_PREVIEW_EXPERIENCES = 3;
const MAX_PREVIEW_EDUCATIONS = 3;

export default function CandidateRow({ candidate }: CandidateRowProps) {
  const {
    userId,
    slug,
    name,
    avatar,
    headline,
    title,
    skills,
    locations,
    expectedSalaryMin,
    expectedSalaryMax,
    salaryCurrency,
    workMode,
    experiences,
    educations,
    gender,
    yearOfBirth,
    educationLevel,
  } = candidate;

  const [modalOpen, setModalOpen] = useState(false);
  const hasMoreExperiences = experiences.length > MAX_PREVIEW_EXPERIENCES;
  const hasMoreEducations = educations.length > MAX_PREVIEW_EDUCATIONS;
  const visibleExperiences = experiences.slice(0, MAX_PREVIEW_EXPERIENCES);
  const visibleEducations = educations.slice(0, MAX_PREVIEW_EDUCATIONS);
  const hiddenExpCount = experiences.length - MAX_PREVIEW_EXPERIENCES;
  const hiddenEduCount = educations.length - MAX_PREVIEW_EDUCATIONS;

  const detailHref = slug ? `/candidates/${encodeURIComponent(slug)}` : "#";
  const displayName = name || "Ứng viên";
  const displayHeadline = headline || title || "Chưa cập nhật tiêu đề nghề nghiệp";
  const salaryDisplay = formatSalaryRange(
    expectedSalaryMin ?? undefined,
    expectedSalaryMax ?? undefined,
    (salaryCurrency as "VND" | "USD") || "VND"
  );
  const currency = (salaryCurrency as "VND" | "USD") || "VND";
  const locationDisplay = locations.length > 0 ? locations[0] : null;

  return (
    <>
      <div className="flex items-start gap-4 rounded-xl border border-[var(--border)] bg-white p-4 transition-shadow hover:shadow-md">
        {/* Left column: Avatar + main info */}
        <div className="shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand)]/20 to-[var(--brand)]/5">
              <User className="h-6 w-6 text-[var(--brand)]" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Name + headline */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-[var(--foreground)]">
                {displayName}
              </p>
              <p className="mt-0.5 truncate text-sm text-[var(--muted-foreground)]">
                {displayHeadline}
              </p>
            </div>
            {/* Right top: salary + location */}
            <div className="shrink-0 text-right">
              {salaryDisplay && (
                <p className="text-sm font-medium text-[var(--brand)]">
                  {salaryDisplay} {currency}
                </p>
              )}
              {locationDisplay && (
                <p className="text-xs text-[var(--muted-foreground)]">{locationDisplay}</p>
              )}
              {workMode && (
                <p className="text-xs text-[var(--muted-foreground)]">{workMode}</p>
              )}
            </div>
          </div>

          {/* Experiences */}
          {experiences.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Kinh nghiệm</p>
              <div className="mt-1 space-y-0.5">
                {visibleExperiences.map((exp) => (
                  <p key={exp.id} className="text-xs text-[var(--foreground)]">
                    <span className="font-medium">{exp.role}</span>
                    {exp.company && ` @ ${exp.company}`}
                    {exp.period && <span className="text-[var(--muted-foreground)]"> · {exp.period}</span>}
                  </p>
                ))}
                {hasMoreExperiences && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModalOpen(true);
                    }}
                    className="text-xs text-[var(--brand)] hover:underline"
                  >
                    Xem thêm {hiddenExpCount} kinh nghiệm khác
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Educations */}
          {educations.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-[var(--muted-foreground)]">Học vấn</p>
              <div className="mt-1 space-y-0.5">
                {visibleEducations.map((edu) => (
                  <p key={edu.id} className="text-xs text-[var(--foreground)]">
                    <span className="font-medium">{edu.degree}</span>
                    {edu.school && ` @ ${edu.school}`}
                    {edu.period && <span className="text-[var(--muted-foreground)]"> · {edu.period}</span>}
                  </p>
                ))}
                {hasMoreEducations && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setModalOpen(true);
                    }}
                    className="text-xs text-[var(--brand)] hover:underline"
                  >
                    Xem thêm {hiddenEduCount} học vấn khác
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bottom row: skills + detail link */}
          <div className="mt-3 flex items-center justify-between gap-3">
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 6).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {skill}
                  </Badge>
                ))}
                {skills.length > 6 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    +{skills.length - 6}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-xs text-[var(--muted-foreground)]">Chưa cập nhật kỹ năng</span>
            )}
            <Link
              href={detailHref}
              className="shrink-0 text-sm font-medium text-[var(--brand)] hover:underline"
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>

      <ExperienceEducationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        candidateName={displayName}
        experiences={experiences}
        educations={educations.map((e) => ({
          id: e.id,
          school: e.school,
          degree: e.degree,
          period: e.period,
        }))}
      />
    </>
  );
}
