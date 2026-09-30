"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setDefaultCandidateCv, updateJobSearchSettings } from "@/lib/api/candidate-cvs";
import { getApiErrorMessage } from "@/lib/api-error";
import { candidateCvKeys } from "@/hooks/useCandidateCvs";
import type { CandidateCvSummary, JobSearchSettings } from "@/types/candidate-cv";

type CvSettingsHeaderProps = {
  cvs: CandidateCvSummary[];
  defaultCvId: string | null;
  settings: JobSearchSettings;
};

export default function CvSettingsHeader({ cvs, defaultCvId, settings }: CvSettingsHeaderProps) {
  const queryClient = useQueryClient();

  const refreshCandidateViews = () => {
    void queryClient.invalidateQueries({ queryKey: candidateCvKeys.list });
    void queryClient.invalidateQueries({ queryKey: candidateCvKeys.settings });
    void queryClient.invalidateQueries({ queryKey: ["candidate-cv"] });
  };

  const setDefault = useMutation({
    mutationFn: setDefaultCandidateCv,
    onSuccess: (list) => {
      queryClient.setQueryData(candidateCvKeys.list, list);
      refreshCandidateViews();
      toast.success("Đã đổi CV mặc định");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Không thể đổi CV mặc định")),
  });

  const updateSettings = useMutation({
    mutationFn: updateJobSearchSettings,
    onSuccess: (next) => {
      queryClient.setQueryData(candidateCvKeys.settings, next);
      toast.success("Đã cập nhật cài đặt");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Không thể lưu cài đặt")),
  });

  const isSaving = setDefault.isPending || updateSettings.isPending;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <h2 className="text-base font-semibold">Thiết lập CV mặc định</h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        CV mặc định là CV doanh nghiệp nhìn thấy khi tìm kiếm ứng viên trong kho ứng viên của JOYWORK.
      </p>

      <div className="mt-4 grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="default-cv-select">CV mặc định</Label>
          <select
            id="default-cv-select"
            className="h-9 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm disabled:opacity-60"
            value={defaultCvId ?? ""}
            disabled={isSaving || cvs.length <= 1}
            onChange={(e) => {
              const nextId = e.target.value;
              if (nextId && nextId !== defaultCvId) setDefault.mutate(nextId);
            }}
          >
            {cvs.map((cv) => (
              <option key={cv.id} value={cv.id}>
                {cv.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Switch
              id="cv-settings-searching"
              checked={settings.isSearchingJob}
              disabled={isSaving}
              onCheckedChange={(checked) => updateSettings.mutate({ isSearchingJob: checked })}
            />
            <Label htmlFor="cv-settings-searching" className="cursor-pointer">
              {settings.isSearchingJob ? "Đang bật tìm việc" : "Đang tắt tìm việc"}
            </Label>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {settings.isSearchingJob
              ? "CV mặc định của bạn sẽ được hiển thị trong kho ứng viên khi doanh nghiệp tìm kiếm."
              : "CV của bạn bị ẩn khỏi tìm kiếm, tuy nhiên bạn vẫn có thể chủ động ứng tuyển."}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Switch
              id="cv-settings-allow-flip"
              checked={settings.allowCvFlip}
              disabled={isSaving}
              onCheckedChange={(checked) => updateSettings.mutate({ allowCvFlip: checked })}
            />
            <Label htmlFor="cv-settings-allow-flip" className="cursor-pointer">
              Cho phép doanh nghiệp xem thông tin liên hệ mà không cần hỏi trước
            </Label>
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">
            {settings.allowCvFlip
              ? "Doanh nghiệp đủ điều kiện có thể mở CV trực tiếp để xem thông tin liên hệ."
              : "Doanh nghiệp phải gửi yêu cầu và chờ bạn đồng ý qua thông báo/email."}
          </p>
        </div>
      </div>
    </div>
  );
}
