"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { OwnUserProfile } from "@/types/user";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const schema = z.object({
  status: z.enum(["OPEN_TO_WORK", "NOT_AVAILABLE", "LOOKING"]).optional().nullable(),
  isSearchingJob: z.boolean().optional(),
  allowCvFlip: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

function mapProfileToDefaults(profile: OwnUserProfile): FormValues {
  const raw = profile.profile?.status;
  const status =
    raw === "OPEN_TO_WORK" || raw === "LOOKING"
      ? "OPEN_TO_WORK"
      : raw === "NOT_AVAILABLE"
        ? "NOT_AVAILABLE"
        : "OPEN_TO_WORK";
  return {
    status,
    isSearchingJob: profile.profile?.isSearchingJob ?? true,
    allowCvFlip: profile.profile?.allowCvFlip ?? true,
  };
}

interface ProfileDiscoverySettingsProps {
  profile: OwnUserProfile;
}

export default function ProfileDiscoverySettings({ profile }: ProfileDiscoverySettingsProps) {
  const queryClient = useQueryClient();
  const { watch, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: mapProfileToDefaults(profile),
  });

  useEffect(() => {
    reset(mapProfileToDefaults(profile));
  }, [profile, reset]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      await api.patch("/api/users/me/profile", {
        status: values.status,
        isSearchingJob: values.isSearchingJob,
        allowCvFlip: values.allowCvFlip,
      });
    },
    onSuccess: () => {
      toast.success("Đã cập nhật cài đặt");
      queryClient.invalidateQueries({ queryKey: ["own-profile"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || "Không thể lưu cài đặt");
    },
  });

  const persist = (next: FormValues) => {
    saveMutation.mutate(next);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-3">
          <Switch
            id="profile-settings-status"
            checked={watch("status") === "OPEN_TO_WORK"}
            onCheckedChange={(checked) => {
              const status = checked ? "OPEN_TO_WORK" : "NOT_AVAILABLE";
              setValue("status", status, { shouldDirty: true });
              persist({
                status,
                isSearchingJob: watch("isSearchingJob") ?? true,
                allowCvFlip: watch("allowCvFlip") ?? true,
              });
            }}
            disabled={saveMutation.isPending}
          />
          <Label htmlFor="profile-settings-status" className="cursor-pointer">
            {watch("status") === "OPEN_TO_WORK" ? "Đang bật tìm việc" : "Đang tắt tìm việc"}
          </Label>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {watch("status") === "OPEN_TO_WORK" ? (
            <span className="text-green-600">
              ✓ Nhà tuyển dụng sẽ biết bạn đang tích cực tìm việc và sẵn sàng ứng tuyển ngay
            </span>
          ) : (
            <span className="text-amber-600">
              ⚠ Hồ sơ của bạn sẽ ít được nhà tuyển dụng chú ý vì bạn không đang tìm việc
            </span>
          )}
        </p>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <Switch
            id="profile-settings-isSearchingJob"
            checked={watch("isSearchingJob") ?? true}
            onCheckedChange={(checked) => {
              setValue("isSearchingJob", checked, { shouldDirty: true });
              persist({
                status: watch("status") ?? "OPEN_TO_WORK",
                isSearchingJob: checked,
                allowCvFlip: watch("allowCvFlip") ?? true,
              });
            }}
            disabled={saveMutation.isPending}
          />
          <Label htmlFor="profile-settings-isSearchingJob" className="cursor-pointer">
            {watch("isSearchingJob") ? "Bật hiển thị trong danh sách ứng viên" : "Tắt hiển thị trong danh sách ứng viên"}
          </Label>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {watch("isSearchingJob")
            ? "Hồ sơ của bạn sẽ xuất hiện tại trang /candidates để doanh nghiệp tìm kiếm."
            : "Hồ sơ của bạn sẽ bị ẩn khỏi tất cả danh sách CV công khai cho doanh nghiệp."}
        </p>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <Switch
            id="profile-settings-allowCvFlip"
            checked={watch("allowCvFlip") ?? true}
            onCheckedChange={(checked) => {
              setValue("allowCvFlip", checked, { shouldDirty: true });
              persist({
                status: watch("status") ?? "OPEN_TO_WORK",
                isSearchingJob: watch("isSearchingJob") ?? true,
                allowCvFlip: checked,
              });
            }}
            disabled={saveMutation.isPending}
          />
          <Label htmlFor="profile-settings-allowCvFlip" className="cursor-pointer">
            {watch("allowCvFlip")
              ? "Cho phép doanh nghiệp mở thông tin liên hệ ngay"
              : "Yêu cầu doanh nghiệp phải xin phép trước khi mở"}
          </Label>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {watch("allowCvFlip")
            ? "Doanh nghiệp đủ điều kiện có thể lật CV trực tiếp để xem thông tin liên hệ."
            : "Doanh nghiệp phải gửi yêu cầu kết nối và chờ bạn đồng ý qua thông báo/email."}
        </p>
      </div>
    </div>
  );
}
