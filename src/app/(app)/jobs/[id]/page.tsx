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

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const qc = useQueryClient();
  const jobId = params?.id as string;

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
        <div className="text-sm text-[var(--muted-foreground)]">
          <Link href={`/companies/${job.company.slug}`} className="font-medium hover:text-[var(--brand)]">
            {job.company.name}
          </Link>
        </div>
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">{job.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <Badge className="border border-[var(--border)] bg-transparent text-[var(--muted-foreground)]">
            {job.employmentType}
          </Badge>
          <Badge className="border border-[var(--border)] bg-transparent text-[var(--muted-foreground)]">
            {job.experienceLevel}
          </Badge>
          <span>{job.remote ? "Làm việc từ xa" : job.location ?? "Không ghi rõ địa điểm"}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)]/60 p-4 text-sm text-[var(--muted-foreground)]">
          <InfoRow label="Mức lương" value={salary} />
          <InfoRow label="Hạn nộp" value={deadline} />
          <InfoRow label="Hình thức" value={job.employmentType} />
          <InfoRow label="Cấp độ" value={job.experienceLevel} />
          <InfoRow label="Địa điểm" value={job.remote ? "Remote" : job.location ?? "Không ghi rõ"} />
          {job.tags?.length ? <InfoRow label="Kỹ năng" value={job.tags.join(", ")} /> : null}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Mô tả công việc</h2>
          <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--muted-foreground)]">{job.description}</p>
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
            <p>Nhấn Apply để gửi hồ sơ cho {job.company.name}.</p>
          </div>
          <div className="flex items-center gap-2">
            <JobSaveButton jobId={job.id} />
            <Button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}>
              {applyMutation.isPending ? "Đang gửi..." : "Ứng tuyển ngay"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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


