"use client";

import { useParams } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";
import JobSaveButton from "@/components/jobs/JobSaveButton";
import { useAuthStore } from "@/store/useAuth";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import CompanyHoverCard from "@/components/company/CompanyHoverCard";
import CompanyFollowButton from "@/components/company/CompanyFollowButton";
import {
  Briefcase,
  MapPin,
  Clock,
  TrendingUp,
  Send,
  BookOpen,
  Zap,
  Heart,
  DollarSign,
  GraduationCap,
  UserCheck,
  Calendar,
} from "lucide-react";
import DOMPurify from "dompurify";
import { cn, formatDateUTC } from "@/lib/utils";

type JobDetail = any;

function sanitizeHtml(html: string | undefined | null) {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p",
      "strong",
      "em",
      "u",
      "s",
      "span",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "h1",
      "h2",
      "h3",
      "br",
      "div",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "style", "class"],
  });
}

const richTextClass =
  "prose prose-sm sm:prose-base prose-slate max-w-none text-[var(--muted-foreground)] leading-relaxed [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1 [&_li]:list-item [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--border)] [&_blockquote]:bg-[var(--muted)]/40 [&_blockquote]:py-2 [&_blockquote]:pl-4";

function InfoItem({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={cn("h-4 w-4", accent ? "text-[var(--brand)]" : "text-[var(--muted-foreground)]")} />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      </div>
      <p className={cn("text-sm font-semibold", accent ? "text-[var(--brand)]" : "text-[var(--foreground)]")}>{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
      <h3 className="mb-4 text-base font-semibold uppercase tracking-wide text-[var(--foreground)] sm:text-lg">{title}</h3>
      {children}
    </section>
  );
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const qc = useQueryClient();
  const jobId = params?.id as string;
  const user = useAuthStore((state) => state.user);
  const { openPrompt } = useAuthPrompt();

  const { data, isLoading } = useQuery<{ job: JobDetail }>({
    queryKey: ["job", jobId],
    queryFn: async () => {
      const res = await api.get(`/api/jobs/${jobId}`);
      return res.data.data;
    },
    enabled: Boolean(jobId),
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      await api.post("/api/jobs/apply", { jobId });
    },
    onSuccess: () => {
      toast.success("Ứng tuyển thành công");
      qc.invalidateQueries({ queryKey: ["job", jobId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error?.message ?? "Ứng tuyển thất bại"),
  });

  const handleApply = () => {
    if (!user) {
      openPrompt("apply");
      return;
    }
    applyMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-28 sm:px-6">
        <div className="h-48 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--card)]" />
      </div>
    );
  }

  const job = data?.job;
  if (!job) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-28 sm:px-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center text-sm text-[var(--muted-foreground)]">
          Không tìm thấy việc làm.
        </div>
      </div>
    );
  }

  const salary =
    job.salaryMin || job.salaryMax
      ? job.salaryMin && job.salaryMax
        ? `${job.salaryMin.toLocaleString("vi-VN")} - ${job.salaryMax.toLocaleString("vi-VN")} ${job.currency}`
        : job.salaryMin
          ? `${job.salaryMin.toLocaleString("vi-VN")} ${job.currency}`
          : `${job.salaryMax.toLocaleString("vi-VN")} ${job.currency}`
      : job.benefitsIncome || "Thoả thuận";

  const deadline = job.applicationDeadline ? formatDateUTC(job.applicationDeadline) : "Không giới hạn";

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-28 sm:px-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
        <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.04]">
          <Briefcase className="h-32 w-32 sm:h-40 sm:w-40" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <CompanyHoverCard companyId={job.company.id} slug={job.company.slug} companyName={job.company.name}>
              <Link
                href={`/companies/${job.company.slug}`}
                className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--brand)] hover:underline sm:text-base"
              >
                {job.company.name}
              </Link>
            </CompanyHoverCard>
            {user ? (
              <CompanyFollowButton
                companyId={job.company.id}
                companySlug={job.company.slug}
                variant="link"
                size="sm"
                className="h-auto p-0 text-sm font-normal text-[#2563eb] hover:text-[#1d4ed8] hover:underline"
              />
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-2xl font-bold leading-tight text-[var(--foreground)] sm:text-3xl">
              Mô tả công việc
              <span className="mt-1 block text-[var(--brand)]">{job.title}</span>
            </h1>
            {job.isActive !== undefined ? (
              <Badge
                className={cn(
                  "w-fit rounded-full border px-3 py-1 text-xs font-medium",
                  job.isActive
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-slate-200 bg-slate-100 text-slate-600"
                )}
              >
                {job.isActive ? "Đang tuyển" : "Đã đóng"}
              </Badge>
            ) : null}
          </div>

          <div className="space-y-3 border-t border-[var(--border)] pt-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {job.department ? <InfoItem icon={Briefcase} label="Bộ phận" value={job.department} /> : null}
              {job.location ? <InfoItem icon={MapPin} label="Địa điểm" value={job.location} /> : null}
              <InfoItem icon={Clock} label="Hình thức" value={translateEmploymentType(job.employmentType)} />
              <InfoItem icon={DollarSign} label="Mức lương" value={salary} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem icon={TrendingUp} label="Kinh nghiệm" value={translateExperienceLevel(job.experienceLevel)} accent />
              {job.jobLevel ? <InfoItem icon={UserCheck} label="Cấp bậc" value={translateJobLevel(job.jobLevel)} accent /> : null}
              {job.educationLevel ? (
                <InfoItem icon={GraduationCap} label="Học vấn" value={translateEducationLevel(job.educationLevel)} accent />
              ) : null}
              <InfoItem icon={Calendar} label="Hạn nộp" value={deadline} accent />
            </div>
          </div>
        </div>
      </header>

      {/* Content Sections - keep existing display order */}
      <div className="space-y-4">
        {/* 1. Sứ mệnh / Vai trò tổng quát */}
        {job.mission ? (
          <SectionCard title="1. Sứ mệnh / Vai trò tổng quát">
            <div
              className={cn(
                richTextClass,
                "rounded-xl border-l-4 border-[var(--brand)] bg-[var(--muted)]/40 p-4 italic text-[var(--foreground)]"
              )}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.mission) }}
            />
          </SectionCard>
        ) : null}

        {/* 2. Nhiệm vụ chuyên môn */}
        {job.tasks ? (
          <SectionCard title="2. Nhiệm vụ chuyên môn">
            <div className={richTextClass} dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.tasks) }} />
          </SectionCard>
        ) : null}

        {/* 3. Kết quả chuyên môn cần đạt */}
        {job.kpis ? (
          <SectionCard title="3. Kết quả chuyên môn cần đạt">
            <p className="mb-3 text-sm text-[var(--muted-foreground)]">
              Công ty vận hành theo hướng quản trị bằng mục tiêu. Vị trí này sẽ cùng CEO/Quản lý xây dựng và thỏa thuận OKRs theo từng chu kỳ.
            </p>
            <div className={richTextClass} dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.kpis) }} />
          </SectionCard>
        ) : null}

        {/* 4. Yêu cầu (KSA - Knowledge, Skills, Attitude) */}
        {job.knowledge || job.skills || job.attitude ? (
          <SectionCard title="4. Yêu cầu (KSA - Knowledge, Skills, Attitude)">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {job.knowledge ? (
                <div className="md:col-span-2">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] sm:text-base">
                    <BookOpen className="h-4 w-4" /> Kiến thức chuyên môn
                  </h4>
                  <div className={richTextClass} dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.knowledge) }} />
                </div>
              ) : null}
              {job.skills ? (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] sm:text-base">
                    <Zap className="h-4 w-4" /> Kỹ năng cần thiết
                  </h4>
                  <div className={richTextClass} dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.skills) }} />
                </div>
              ) : null}
              {job.attitude ? (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] sm:text-base">
                    <Heart className="h-4 w-4" /> Thái độ và phẩm chất
                  </h4>
                  <div className={richTextClass} dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.attitude) }} />
                </div>
              ) : null}
            </div>
          </SectionCard>
        ) : null}

        {/* 5. Quyền hạn và phạm vi ra quyết định */}
        {job.authority ? (
          <SectionCard title="5. Quyền hạn và phạm vi ra quyết định">
            <h4 className="mb-2 text-sm font-semibold text-[var(--foreground)] sm:text-base">Có thể tự quyết</h4>
            <div className={richTextClass} dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.authority) }} />
          </SectionCard>
        ) : null}

        {/* 6. Quan hệ công việc */}
        {job.relationships ? (
          <SectionCard title="6. Quan hệ công việc">
            <div className={richTextClass} dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.relationships) }} />
          </SectionCard>
        ) : null}

        {/* 7. Lộ trình phát triển */}
        {job.careerPath ? (
          <SectionCard title="7. Lộ trình phát triển">
            <p className="mb-3 text-sm text-[var(--muted-foreground)]">
              Tùy thuộc vào năng lực và nguyện vọng cá nhân, có thể phát triển theo hướng:
            </p>
            <div className={richTextClass} dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.careerPath) }} />
          </SectionCard>
        ) : null}

        {/* 8. Quyền lợi */}
        {job.benefitsIncome || job.benefitsPerks ? (
          <SectionCard title="8. Quyền lợi">
            {job.benefitsIncome ? (
              <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4">
                <h4 className="mb-1 text-sm font-semibold text-[var(--foreground)] sm:text-base">Thu nhập</h4>
                <p className="text-xl font-bold text-[var(--brand)] sm:text-2xl">{job.benefitsIncome}</p>
              </div>
            ) : null}
            {job.benefitsPerks ? (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-[var(--foreground)] sm:text-base">Chế độ, phúc lợi</h4>
                <div className={richTextClass} dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.benefitsPerks) }} />
              </div>
            ) : null}
          </SectionCard>
        ) : null}

        {/* Thông tin bổ sung */}
        {job.generalInfo ? (
          <SectionCard title="Thông tin bổ sung">
            <div className={richTextClass} dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.generalInfo) }} />
          </SectionCard>
        ) : null}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 z-50 w-full border-t border-[var(--border)] bg-[var(--card)] p-3">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:px-2 md:flex-row md:items-center md:justify-between">
          <div className="hidden text-sm text-[var(--muted-foreground)] md:block">
            {job.contact ? (
              <div className="line-clamp-2 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.contact) }} />
            ) : (
              <span>Ứng tuyển để nhận thêm thông tin liên hệ từ nhà tuyển dụng.</span>
            )}
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto">
            <JobSaveButton jobId={job.id} />
            {job.isActive === false ? (
              <Button disabled className="h-10 px-5 text-sm">
                Đã ngừng tuyển
              </Button>
            ) : (
              <Button onClick={handleApply} disabled={applyMutation.isPending} className="h-10 px-5 text-sm sm:text-base">
                {applyMutation.isPending ? "Đang gửi..." : "Ứng tuyển ngay"}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
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

function translateExperienceLevel(level?: string) {
  switch (level) {
    case "NO_EXPERIENCE":
      return "Không yêu cầu kinh nghiệm";
    case "LT_1_YEAR":
      return "Dưới 1 năm";
    case "Y1_2":
      return "1 - 2 năm";
    case "Y2_3":
      return "2 - 3 năm";
    case "Y3_5":
      return "3 - 5 năm";
    case "Y5_10":
      return "5 - 10 năm";
    case "GT_10":
      return "Trên 10 năm";
    default:
      return level || "";
  }
}

function translateJobLevel(level?: string) {
  switch (level) {
    case "INTERN_STUDENT":
      return "Thực tập sinh / Sinh viên";
    case "FRESH_GRAD":
      return "Mới tốt nghiệp";
    case "EMPLOYEE":
      return "Nhân viên";
    case "SPECIALIST_TEAM_LEAD":
      return "Chuyên viên / Trưởng nhóm";
    case "MANAGER_HEAD":
      return "Quản lý / Trưởng phòng";
    case "DIRECTOR":
      return "Giám đốc";
    case "EXECUTIVE":
      return "Điều hành";
    default:
      return level || "";
  }
}

function translateEducationLevel(level?: string) {
  switch (level) {
    case "NONE":
      return "Không yêu cầu";
    case "HIGH_SCHOOL":
      return "Trung học phổ thông";
    case "COLLEGE":
      return "Cao đẳng";
    case "BACHELOR":
      return "Đại học";
    case "MASTER":
      return "Thạc sĩ";
    case "PHD":
      return "Tiến sĩ";
    default:
      return level || "";
  }
}
