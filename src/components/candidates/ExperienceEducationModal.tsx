"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Briefcase, GraduationCap } from "lucide-react";

type ExperienceItem = {
  id: string;
  role: string;
  company: string;
  period: string | null;
  desc?: string | null;
  achievements?: string[];
};

type EducationItem = {
  id: string;
  school: string;
  degree: string;
  period: string | null;
  gpa?: string | null;
  honors?: string | null;
};

interface ExperienceEducationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string | null;
  experiences: ExperienceItem[];
  educations: EducationItem[];
}

export default function ExperienceEducationModal({
  open,
  onOpenChange,
  candidateName,
  experiences,
  educations,
}: ExperienceEducationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {candidateName || "Ứng viên"} — Kinh nghiệm & Học vấn
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-6 pt-2">
              {/* Experience Section */}
              {experiences.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[var(--brand)]" />
                    <h3 className="font-semibold text-sm">Kinh nghiệm làm việc</h3>
                  </div>
                  <div className="space-y-4 border-l-2 border-[var(--border)] pl-4">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="relative">
                        <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--brand)] bg-white" />
                        <div>
                          <p className="font-medium text-sm">{exp.role}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">{exp.company}</p>
                          {exp.period && (
                            <p className="text-xs text-[var(--muted-foreground)]">{exp.period}</p>
                          )}
                          {exp.desc && (
                            <p
                              className="mt-1 text-xs text-[var(--foreground)] whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: exp.desc }}
                            />
                          )}
                          {(exp.achievements?.length ?? 0) > 0 && (
                            <div className="mt-2 space-y-1">
                              {(exp.achievements ?? []).map((ach, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <span className="mt-1 text-[10px] text-[var(--brand)]">•</span>
                                  <span className="text-xs">{ach}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-[var(--brand)]" />
                    <h3 className="font-semibold text-sm">Kinh nghiệm làm việc</h3>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] pl-6">
                    Chưa cập nhật kinh nghiệm làm việc.
                  </p>
                </div>
              )}

              {/* Education Section */}
              {educations.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-[var(--brand)]" />
                    <h3 className="font-semibold text-sm">Học vấn</h3>
                  </div>
                  <div className="space-y-4">
                    {educations.map((edu) => (
                      <div key={edu.id} className="rounded-lg border border-[var(--border)] p-3">
                        <p className="font-medium text-sm">{edu.school}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{edu.degree}</p>
                        {edu.period && (
                          <p className="text-xs text-[var(--muted-foreground)]">{edu.period}</p>
                        )}
                        {edu.gpa && (
                          <p className="text-xs text-[var(--muted-foreground)]">GPA: {edu.gpa}</p>
                        )}
                        {edu.honors && (
                          <p className="text-xs text-[var(--muted-foreground)]">Thành tích: {edu.honors}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-[var(--brand)]" />
                    <h3 className="font-semibold text-sm">Học vấn</h3>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] pl-6">
                    Chưa cập nhật học vấn.
                  </p>
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
