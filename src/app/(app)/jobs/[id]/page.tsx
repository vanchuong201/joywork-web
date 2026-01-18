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
import { Briefcase, MapPin, Clock, CheckCircle, CheckSquare, TrendingUp, Star, Send, BookOpen, Zap, Heart } from "lucide-react";
import DOMPurify from "dompurify";

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

  if (isLoading) return <div className="h-40 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--card)]" />;

  const job = data?.job;
  if (!job) return <div>Không tìm thấy việc làm</div>;

  const salary =
    job.salaryMin || job.salaryMax
      ? job.salaryMin && job.salaryMax
        ? `${job.salaryMin.toLocaleString("vi-VN")} - ${job.salaryMax.toLocaleString("vi-VN")} ${job.currency}`
        : job.salaryMin
        ? `${job.salaryMin.toLocaleString("vi-VN")} ${job.currency}`
        : `${job.salaryMax.toLocaleString("vi-VN")} ${job.currency}`
      : job.benefitsIncome || "Thoả thuận";

  const deadline = job.applicationDeadline ? formatDate(job.applicationDeadline) : "Không giới hạn";

  // Sanitize HTML content
  const sanitizeHtml = (html: string | undefined | null) => {
    if (!html) return "";
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "strong", "em", "u", "s", "span", "a", "ul", "ol", "li", "blockquote", "code", "pre", "h1", "h2", "h3", "br", "div"],
      ALLOWED_ATTR: ["href", "target", "rel", "style", "class"],
    });
  };
  const richTextClass = "prose prose-slate max-w-none text-slate-600 leading-relaxed [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1 [&_li]:list-item";
  const richTextClassTight = "prose prose-slate max-w-none text-slate-600 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1 [&_li]:list-item";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
      {/* Header */}
      <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Briefcase size={200} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
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
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 uppercase leading-tight">
            MÔ TẢ CÔNG VIỆC <br />
            <span className="text-[var(--brand)]">{job.title}</span>
          </h1>
          <div className="flex flex-wrap gap-4 mt-6">
            {job.location && (
              <span className="bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-bold flex items-center gap-2">
                <MapPin size={16} /> {job.location}
              </span>
            )}
            <span className="bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-bold flex items-center gap-2">
              <Clock size={16} /> {translateEmploymentType(job.employmentType)}
            </span>
            {job.remote && (
              <span className="bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-bold flex items-center gap-2">
                <MapPin size={16} /> Làm việc từ xa
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-8">
        {/* 1. Thông tin chung */}
        {job.generalInfo && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 uppercase">1. Thông tin chung</h3>
            <div
              className="prose prose-slate max-w-none text-slate-700 leading-relaxed [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1 [&_li]:list-item"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.generalInfo) }}
            />
          </div>
        )}

        {/* 2. Sứ mệnh / Vai trò tổng quát */}
        {job.mission && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 uppercase">2. Sứ mệnh / Vai trò tổng quát</h3>
            <div
              className="bg-slate-50 p-6 rounded-2xl border-l-4 border-[var(--brand)] text-slate-700 leading-relaxed text-lg italic prose prose-slate max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1 [&_li]:list-item"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.mission) }}
            />
          </div>
        )}

        {/* 3. Nhiệm vụ chuyên môn */}
        {job.tasks && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 uppercase">3. Nhiệm vụ chuyên môn</h3>
            <div
              className={richTextClass}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.tasks) }}
            />
          </div>
        )}

        {/* 4. Kết quả chuyên môn cần đạt */}
        {job.kpis && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 uppercase">4. Kết quả chuyên môn cần đạt</h3>
            <p className="mb-4 text-slate-700">Công ty vận hành theo hướng quản trị bằng mục tiêu. Vị trí này sẽ cùng CEO/Quản lý xây dựng và thỏa thuận OKRs theo từng chu kỳ.</p>
            <div
              className={richTextClassTight}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.kpis) }}
            />
          </div>
        )}

        {/* 5. Yêu cầu (KSA) */}
        {(job.knowledge || job.skills || job.attitude) && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 uppercase">5. Yêu cầu (KSA - Knowledge, Skills, Attitude)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {job.knowledge && (
                <div className="col-span-2">
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <BookOpen size={18} /> Kiến thức chuyên môn:
                  </h4>
                  <div
                    className={richTextClassTight}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.knowledge) }}
                  />
                </div>
              )}
              {job.skills && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Zap size={18} /> Kỹ năng cần thiết:
                  </h4>
                  <div
                    className={richTextClassTight}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.skills) }}
                  />
                </div>
              )}
              {job.attitude && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Heart size={18} /> Thái độ và phẩm chất:
                  </h4>
                  <div
                    className={richTextClassTight}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.attitude) }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Quyền hạn */}
        {job.authority && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 uppercase">6. Quyền hạn và phạm vi ra quyết định</h3>
            <h4 className="font-bold text-slate-900 mb-3">Có thể tự quyết:</h4>
            <div
              className={richTextClassTight}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.authority) }}
            />
          </div>
        )}

        {/* 7. Quan hệ công việc */}
        {job.relationships && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 uppercase">7. Quan hệ công việc</h3>
            <div
              className={richTextClassTight}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.relationships) }}
            />
          </div>
        )}

        {/* 8. Lộ trình phát triển */}
        {job.careerPath && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 uppercase">8. Lộ trình phát triển</h3>
            <p className="mb-4 text-slate-700">Tùy thuộc vào năng lực và nguyện vọng cá nhân, có thể phát triển theo hướng:</p>
            <div
              className={richTextClassTight}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.careerPath) }}
            />
          </div>
        )}

        {/* 9. Quyền lợi */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 uppercase">9. Quyền lợi</h3>
          <div className="mb-6">
            <h4 className="font-bold text-slate-900 text-lg mb-2">Thu nhập:</h4>
            <div className="text-2xl font-black text-[var(--brand)] mb-1">{salary}</div>
          </div>
          {job.benefitsPerks && (
            <div>
              <h4 className="font-bold text-slate-900 text-lg mb-2">Chế độ, phúc lợi:</h4>
              <div
                className={richTextClassTight}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.benefitsPerks) }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-600 hidden md:block">
            {job.contact ? (
              <div className="whitespace-pre-line font-medium" dangerouslySetInnerHTML={{ __html: sanitizeHtml(job.contact) }} />
            ) : (
              <span>Gửi CV về: tuyendung@company.vn</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <JobSaveButton jobId={job.id} />
            <Button onClick={handleApply} disabled={applyMutation.isPending} className="px-8 py-3 text-lg">
              {applyMutation.isPending ? "Đang gửi..." : "Ứng tuyển ngay"} <Send size={20} className="ml-2" />
            </Button>
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
