"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Circle, ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import CvExportButton from "@/components/cv/CvExportButton";
import CvNameDialog from "@/components/account/cv/CvNameDialog";
import ProfileBasicInfo from "@/components/account/profile/ProfileBasicInfo";
import ProfileKSA from "@/components/account/profile/ProfileKSA";
import ProfileExpectations from "@/components/account/profile/ProfileExpectations";
import ProfileExperiences from "@/components/account/profile/ProfileExperiences";
import ProfileEducations from "@/components/account/profile/ProfileEducations";
import { updateCandidateCv } from "@/lib/api/candidate-cvs";
import { buildOwnedCvPublicHref } from "@/lib/candidate-url";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error";
import { buildProfileCompletion } from "@/hooks/useProfileCompletion";
import {
  invalidateCandidateCv,
  toOwnUserProfile,
  useCandidateCv,
  useCandidateCvList,
  useOwnAccount,
} from "@/hooks/useCandidateCvs";

export default function CvEditorScreen({ cvId }: { cvId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const cvQuery = useCandidateCv(cvId);
  const listQuery = useCandidateCvList();
  const accountQuery = useOwnAccount();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const cv = cvQuery.data;
  const profile = useMemo(
    () => (cv ? toOwnUserProfile(cv, accountQuery.data) : null),
    [cv, accountQuery.data],
  );

  const rename = useMutation({
    mutationFn: (name: string) => updateCandidateCv(cvId, { name }),
    onSuccess: () => {
      setIsRenameOpen(false);
      invalidateCandidateCv(queryClient, cvId);
      toast.success("Đã đổi tên CV");
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, "Không thể đổi tên CV");
      if (getApiErrorCode(error) === "CV_NAME_DUPLICATE") {
        setRenameError(message);
        return;
      }
      toast.error(message);
    },
  });

  if (cvQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-96 w-full animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  if (cvQuery.isError || !cv || !profile) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/account/profile">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            CV của tôi
          </Link>
        </Button>
        <EmptyState title="Không tìm thấy CV" subtitle="CV có thể đã bị xóa hoặc không thuộc tài khoản của bạn." />
      </div>
    );
  }

  const list = listQuery.data;
  const canCreateNewCv = list ? list.cvs.length < list.limit : false;
  const { completionItems, completionPercent } = buildProfileCompletion(profile);
  const publicHref = buildOwnedCvPublicHref(cv, accountQuery.data);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/account/profile">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          CV của tôi
        </Link>
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-bold sm:text-2xl">{cv.name}</h1>
            {cv.isDefault ? (
              <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">Mặc định</Badge>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRenameError(null);
                setIsRenameOpen(true);
              }}
            >
              <Pencil className="mr-1.5 h-4 w-4" />
              Đổi tên
            </Button>
          </div>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Chỉnh sửa nội dung CV này. Thay đổi không ảnh hưởng tới các đơn đã ứng tuyển trước đó.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto">
          {publicHref ? (
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href={publicHref} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Xem CV công khai
              </Link>
            </Button>
          ) : null}
          <CvExportButton mode="own" cvId={cv.id} className="w-full sm:w-auto" label="Tải về" />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">Tiến độ hoàn thiện CV</p>
            <p className="text-2xl font-bold">{completionPercent}%</p>
          </div>
          {!cv.readiness.isReady ? (
            <p className="text-sm text-amber-600">
              Cần hoàn thiện {cv.readiness.missingSections.join(", ")} để dùng CV này ứng tuyển
            </p>
          ) : (
            <p className="text-sm text-emerald-600">CV đã đủ thông tin để ứng tuyển</p>
          )}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {completionItems.map((item) => (
            <div
              key={item.key}
              className={`rounded-lg border px-3 py-2 text-sm ${
                item.completed
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {item.completed ? (
                  <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                ) : (
                  <Circle size={14} className="shrink-0 text-slate-400" />
                )}
                <span className="font-medium">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ProfileBasicInfo
        cvId={cv.id}
        profile={profile}
        canCreateNewCv={canCreateNewCv}
        onCreatedCv={(newCvId) => router.push(`/account/profile/cv/${encodeURIComponent(newCvId)}`)}
      />
      <ProfileKSA cvId={cv.id} profile={profile} />
      <ProfileExpectations cvId={cv.id} profile={profile} />
      <ProfileExperiences cvId={cv.id} experiences={cv.experiences || []} />
      <ProfileEducations cvId={cv.id} educations={cv.educations || []} />

      <CvNameDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        title="Đổi tên CV"
        submitLabel="Lưu"
        defaultName={cv.name}
        isSubmitting={rename.isPending}
        serverError={renameError}
        onSubmit={(name) => {
          setRenameError(null);
          rename.mutate(name);
        }}
      />
    </div>
  );
}
