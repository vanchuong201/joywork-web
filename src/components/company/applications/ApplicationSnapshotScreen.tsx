"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, History, MessageSquare, RefreshCw } from "lucide-react";

import ApplicationCoverLetter from "@/components/company/ApplicationCoverLetter";
import CvExportButton from "@/components/cv/CvExportButton";
import PublicProfilePageContent from "@/components/profile/PublicProfilePageContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getApplicationDetail } from "@/lib/api/applications";
import { snapshotToPublicProfile } from "@/lib/application-snapshot";
import { buildApplicationUrl } from "@/lib/candidate-url";
import { buildJobUrl } from "@/lib/job-url";
import { cn, formatDate } from "@/lib/utils";
import ApplicationStatusDialog from "./ApplicationStatusDialog";
import {
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_FALLBACK_COLOR,
  APPLICATION_STATUS_LABEL,
} from "./application-status";

type ApplicationSnapshotScreenProps = {
  companySlug: string;
  applicationId: string;
};

export default function ApplicationSnapshotScreen({ companySlug, applicationId }: ApplicationSnapshotScreenProps) {
  const queryClient = useQueryClient();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["application-detail", applicationId],
    queryFn: () => getApplicationDetail(applicationId),
    enabled: Boolean(applicationId),
    retry: false,
  });

  const snapshotProfile = useMemo(
    () => (data?.snapshot ? snapshotToPublicProfile(data.snapshot) : null),
    [data?.snapshot],
  );

  const backHref = `/companies/${encodeURIComponent(companySlug)}/manage?tab=applications`;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Không tìm thấy đơn ứng tuyển</h2>
          <p className="mb-4 text-sm text-[var(--muted-foreground)]">
            Đơn ứng tuyển không tồn tại hoặc bạn không có quyền xem.
          </p>
          <Button asChild variant="outline">
            <Link href={backHref}>Quay lại danh sách ứng tuyển</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { application, snapshot, previousApplications } = data;
  const candidateName = snapshotProfile?.name || snapshot?.account.name || "Ứng viên";
  const snapshotLine = snapshot
    ? snapshot.source === "backfill"
      ? "Bản CV được lưu khi nâng cấp hệ thống"
      : `Bản CV tại thời điểm ứng tuyển ${formatDate(snapshot.capturedAt)}`
    : null;

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20">
      <div className="mx-auto max-w-5xl space-y-4 px-4 pt-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách ứng tuyển
        </Link>

        <Card className="border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold text-[var(--foreground)]">{candidateName}</h1>
                <Badge
                  className={cn(
                    "border px-2.5 py-0.5 text-xs font-medium",
                    APPLICATION_STATUS_COLORS[application.status] || APPLICATION_STATUS_FALLBACK_COLOR,
                  )}
                >
                  {APPLICATION_STATUS_LABEL[application.status] || application.status}
                </Badge>
                {application.reapplyIndex > 1 ? (
                  <Badge variant="outline" className="gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Ứng tuyển lại (lần {application.reapplyIndex})
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                Vị trí:{" "}
                <Link
                  href={buildJobUrl(application.job)}
                  target="_blank"
                  className="font-medium text-[var(--brand)] hover:underline"
                >
                  {application.job.title}
                </Link>{" "}
                · Ngày nộp: {formatDate(application.appliedAt)}
              </p>
              {snapshotLine ? <p className="text-xs text-[var(--muted-foreground)]">{snapshotLine}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(true)}>
                <Edit className="mr-1.5 h-4 w-4" />
                Cập nhật trạng thái
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/inbox/${encodeURIComponent(application.id)}`}>
                  <MessageSquare className="mr-1.5 h-4 w-4" />
                  Nhắn tin
                </Link>
              </Button>
              {snapshot ? <CvExportButton mode="application" applicationId={application.id} size="sm" /> : null}
            </div>
          </div>

          {application.coverLetter ? (
            <div className="mt-4 border-t border-[var(--border)] pt-3">
              <ApplicationCoverLetter text={application.coverLetter} />
            </div>
          ) : null}
          {application.notes ? (
            <div className="mt-3 border-t border-[var(--border)] pt-3">
              <p className="mb-1 text-xs font-medium text-[var(--muted-foreground)]">Phản hồi của doanh nghiệp:</p>
              <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{application.notes}</p>
            </div>
          ) : null}

          {previousApplications.length > 0 ? (
            <div className="mt-3 border-t border-[var(--border)] pt-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                <History className="h-3.5 w-3.5" />
                Các lần ứng tuyển trước
              </p>
              <ul className="space-y-1 text-sm">
                {previousApplications.map((prev) => (
                  <li key={prev.id} className="flex flex-wrap items-center gap-2">
                    <Link
                      href={buildApplicationUrl(companySlug, prev.id)}
                      className="text-[var(--brand)] hover:underline"
                    >
                      {formatDate(prev.appliedAt)}
                      {prev.sourceCvName ? ` · ${prev.sourceCvName}` : ""}
                    </Link>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {APPLICATION_STATUS_LABEL[prev.status] || prev.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      </div>

      {snapshotProfile ? (
        <PublicProfilePageContent profile={snapshotProfile} className="pb-8" />
      ) : (
        <div className="mx-auto mt-4 max-w-5xl px-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center text-sm text-[var(--muted-foreground)]">
            Không có bản lưu CV cho đơn ứng tuyển này.
          </div>
        </div>
      )}

      <ApplicationStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        target={{
          id: application.id,
          status: application.status,
          notes: application.notes,
          candidateName,
          jobTitle: application.job.title,
        }}
        onUpdated={() => {
          void queryClient.invalidateQueries({ queryKey: ["application-detail", applicationId] });
          void queryClient.invalidateQueries({ queryKey: ["company-applications"] });
        }}
      />
    </div>
  );
}
