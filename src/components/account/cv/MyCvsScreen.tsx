"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import CvCard from "@/components/account/cv/CvCard";
import CvNameDialog from "@/components/account/cv/CvNameDialog";
import CvDeleteConfirmDialog from "@/components/account/cv/CvDeleteConfirmDialog";
import CvSettingsHeader from "@/components/account/cv/CvSettingsHeader";
import CvImportJobBanner from "@/components/account/cv/CvImportJobBanner";
import {
  createCandidateCv,
  deleteCandidateCv,
  duplicateCandidateCv,
} from "@/lib/api/candidate-cvs";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error";
import { buildOwnedCvPublicHref } from "@/lib/candidate-url";
import {
  candidateCvKeys,
  invalidateCandidateCv,
  useCandidateCvList,
  useJobSearchSettings,
  useOwnAccount,
} from "@/hooks/useCandidateCvs";
import type { CandidateCvSummary } from "@/types/candidate-cv";

const NAME_ERROR_CODES = new Set(["CV_NAME_DUPLICATE", "VALIDATION_ERROR"]);

export default function MyCvsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const listQuery = useCandidateCvList();
  const settingsQuery = useJobSearchSettings();
  const accountQuery = useOwnAccount();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CandidateCvSummary | null>(null);

  const refreshList = useCallback(() => invalidateCandidateCv(queryClient), [queryClient]);

  const createCv = useMutation({
    mutationFn: createCandidateCv,
    onSuccess: (cv) => {
      setIsCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: candidateCvKeys.list });
      toast.success("Đã tạo CV mới");
      router.push(`/account/profile/cv/${encodeURIComponent(cv.id)}`);
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, "Không thể tạo CV");
      if (NAME_ERROR_CODES.has(getApiErrorCode(error) ?? "")) {
        setCreateError(message);
        return;
      }
      toast.error(message);
    },
  });

  const duplicateCv = useMutation({
    mutationFn: (cv: CandidateCvSummary) => duplicateCandidateCv(cv.id),
    onSuccess: (cv) => {
      void queryClient.invalidateQueries({ queryKey: candidateCvKeys.list });
      toast.success(`Đã nhân bản thành "${cv.name}"`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Không thể nhân bản CV")),
  });

  const deleteCv = useMutation({
    mutationFn: (cv: CandidateCvSummary) => deleteCandidateCv(cv.id),
    onSuccess: (_, cv) => {
      setDeleteTarget(null);
      queryClient.removeQueries({ queryKey: candidateCvKeys.detail(cv.id) });
      void queryClient.invalidateQueries({ queryKey: candidateCvKeys.list });
      toast.success("Đã xóa CV");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Không thể xóa CV")),
  });

  if (listQuery.isLoading || settingsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-40 w-full animate-pulse rounded bg-slate-200" />
        <div className="h-28 w-full animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  if (listQuery.isError || settingsQuery.isError || !listQuery.data || !settingsQuery.data) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold sm:text-2xl">CV của tôi</h1>
        <EmptyState
          title="Không tải được danh sách CV"
          subtitle="Vui lòng thử lại hoặc liên hệ đội hỗ trợ nếu lỗi tiếp diễn."
        />
      </div>
    );
  }

  const { cvs, limit, defaultCvId } = listQuery.data;
  const settings = settingsQuery.data;
  const isLimitReached = cvs.length >= limit;
  const isBusy = duplicateCv.isPending || deleteCv.isPending;
  const account = accountQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">CV của tôi</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Tạo tối đa {limit} CV cho các vị trí khác nhau và chọn CV phù hợp khi ứng tuyển.
        </p>
      </div>

      <CvImportJobBanner onApplied={refreshList} />

      <CvSettingsHeader cvs={cvs} defaultCvId={defaultCvId} settings={settings} />

      <div className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold">
            Danh sách CV ({cvs.length}/{limit})
          </h2>
          <Button
            onClick={() => {
              setCreateError(null);
              setIsCreateOpen(true);
            }}
            disabled={isLimitReached}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Tạo CV
          </Button>
        </div>
        {isLimitReached ? (
          <p className="text-sm text-amber-700">Bạn đã đạt giới hạn {limit} CV. Xóa bớt CV để tạo mới.</p>
        ) : null}

        {cvs.map((cv) => (
          <CvCard
            key={cv.id}
            cv={cv}
            publicHref={buildOwnedCvPublicHref(cv, account)}
            isOnlyCv={cvs.length <= 1}
            isLimitReached={isLimitReached}
            isBusy={isBusy}
            onDuplicate={(target) => duplicateCv.mutate(target)}
            onDelete={setDeleteTarget}
          />
        ))}
      </div>

      <CvNameDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Tạo CV mới"
        description="Đặt tên để dễ phân biệt các CV, ví dụ theo vị trí ứng tuyển."
        submitLabel="Tạo CV"
        isSubmitting={createCv.isPending}
        serverError={createError}
        onSubmit={(name) => {
          setCreateError(null);
          createCv.mutate(name);
        }}
      />

      <CvDeleteConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        cvName={deleteTarget?.name ?? ""}
        isDeleting={deleteCv.isPending}
        onConfirm={() => deleteTarget && deleteCv.mutate(deleteTarget)}
      />
    </div>
  );
}
