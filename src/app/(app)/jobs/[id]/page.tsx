"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";
import JobSaveButton from "@/components/jobs/JobSaveButton";
import { useAuthStore } from "@/store/useAuth";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import CompanyHoverCard from "@/components/company/CompanyHoverCard";
import CompanyFollowButton from "@/components/company/CompanyFollowButton";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const qc = useQueryClient();
  const jobId = params?.id as string;
  const user = useAuthStore((state) => state.user);
  const { openPrompt } = useAuthPrompt();

  const { data, isLoading } = useQuery<{ job: any }>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const res = await api.get(`/api/jobs/${jobId}`);
      return res.data.data;
    },
    enabled: !!jobId,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/jobs/apply", { jobId });
    },
    onSuccess: () => {
      toast.success("Application submitted");
      qc.invalidateQueries({ queryKey: ["job", jobId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Failed to apply"),
  });

  const handleApply = () => {
    if (!user) {
      openPrompt("apply");
      return;
    }
    applyMutation.mutate();
  };

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)]" />;

  const job = data?.job;
  if (!job) return <div>Job not found</div>;

  const salary =
    job.salaryMin || job.salaryMax
      ? job.salaryMin && job.salaryMax
        ? `${job.salaryMin.toLocaleString("vi-VN")} - ${job.salaryMax.toLocaleString("vi-VN")} ${job.currency}`
        : job.salaryMin
        ? `${job.salaryMin.toLocaleString("vi-VN")} ${job.currency}`
        : `${job.salaryMax.toLocaleString("vi-VN")} ${job.currency}`
      : "Thoả thuận";

  const deadline = job.applicationDeadline ? formatDate(job.applicationDeadline) : "Không giới hạn";

  return (
    <Card className="space-y-6">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <CompanyHoverCard companyId={job.company.id} slug={job.company.slug} companyName={job.company.name}>
            <Link href={`/companies/${job.company.slug}`} className="text-base font-semibold text-[var(--foreground)] hover:text-[var(--brand)] hover:underline">
              {job.company.name}
            </Link>
          </CompanyHoverCard>
          {user && (
            <CompanyFollowButton
              companyId={job.company.id}
              companySlug={job.company.slug}
              variant="link"
              size="sm"
              className="text-[#2563eb] hover:text-[#1d4ed8] hover:underline p-0 h-auto font-normal text-sm"
            />
          )}
        </div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">{job.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Badge className="border border-[var(--border)] bg-transparent text-[var(--muted-foreground)]">
            {translateEmploymentType(job.employmentType)}
          </Badge>
          <Badge className="border border-[var(--border)] bg-transparent text-[var(--muted-foreground)]">
            {translateExperienceLevel(job.experienceLevel)}
          </Badge>
          <span>{job.remote ? "Làm việc từ xa" : job.location ?? "Không ghi rõ địa điểm"}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)]/60 p-4 text-sm text-[var(--muted-foreground)]">
          <InfoRow label="Mức lương" value={salary} />
          <InfoRow label="Hạn nộp" value={deadline} />
          <InfoRow label="Hình thức" value={translateEmploymentType(job.employmentType)} />
          <InfoRow label="Cấp độ" value={translateExperienceLevel(job.experienceLevel)} />
          <InfoRow label="Địa điểm" value={job.remote ? "Làm việc từ xa" : job.location ?? "Không ghi rõ"} />
          {job.tags?.length ? <InfoRow label="Kỹ năng" value={job.tags.join(", ")} /> : null}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Mô tả công việc</h2>
          <div
            className="prose prose-sm max-w-none text-[var(--muted-foreground)]"
            dangerouslySetInnerHTML={{ __html: job.description ?? "" }}
          />
          {job.requirements ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Yêu cầu</h3>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)]">{job.requirements}</p>
            </div>
          ) : null}
          {job.responsibilities ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Trách nhiệm</h3>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)]">
                {job.responsibilities}
              </p>
            </div>
          ) : null}
          {job.benefits ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--foreground)]">Quyền lợi</h3>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)]">{job.benefits}</p>
            </div>
          ) : null}
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-4 text-sm text-[var(--muted-foreground)]">
          <div>
            <p className="font-medium text-[var(--foreground)]">Quan tâm đến vị trí này?</p>
            <p>Nhấn vào <strong>Ứng tuyển ngay</strong> để gửi hồ sơ cho {job.company.name}.</p>
          </div>
          <div className="flex items-center gap-2">
            <JobSaveButton jobId={job.id} />
            <Button onClick={handleApply} disabled={applyMutation.isPending}>
              {applyMutation.isPending ? "Đang gửi..." : "Ứng tuyển ngay"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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

function translateExperienceLevel(level?: string) {
  switch (level) {
    case "ENTRY":
      return "Mới tốt nghiệp";
    case "JUNIOR":
      return "Nhân viên";
    case "MID":
      return "Chuyên viên";
    case "SENIOR":
      return "Chuyên viên cao cấp";
    case "LEAD":
      return "Trưởng nhóm";
    case "EXECUTIVE":
      return "Điều hành";
    default:
      return level ?? "";
  }
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md bg-white/60 p-3 shadow-sm">
      <span className="text-xs uppercase text-[var(--muted-foreground)]">{label}</span>
      <span className="text-sm font-medium text-[var(--foreground)]">{value}</span>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}


