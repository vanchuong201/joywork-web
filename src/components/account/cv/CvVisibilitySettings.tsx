"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateCandidateCv } from "@/lib/api/candidate-cvs";
import { getApiErrorMessage } from "@/lib/api-error";
import { invalidateCandidateCv } from "@/hooks/useCandidateCvs";
import type { UserProfileVisibility } from "@/types/user";

type VisibilityKey = keyof Required<UserProfileVisibility>;

const SECTIONS: Array<{ key: VisibilityKey; label: string }> = [
  { key: "bio", label: "Giới thiệu" },
  { key: "ksa", label: "Năng lực (KSA)" },
  { key: "expectations", label: "Mong muốn (Quyền lợi)" },
  { key: "experience", label: "Kinh nghiệm làm việc" },
  { key: "education", label: "Học vấn" },
];

const toFlags = (value?: UserProfileVisibility | null): Record<VisibilityKey, boolean> => ({
  bio: value?.bio !== false,
  ksa: value?.ksa !== false,
  expectations: value?.expectations !== false,
  experience: value?.experience !== false,
  education: value?.education !== false,
});

type CvVisibilitySettingsProps = {
  cvId: string;
  visibility?: UserProfileVisibility | null;
};

export default function CvVisibilitySettings({ cvId, visibility }: CvVisibilitySettingsProps) {
  const queryClient = useQueryClient();
  const [flags, setFlags] = useState(() => toFlags(visibility));

  useEffect(() => {
    setFlags(toFlags(visibility));
  }, [visibility]);

  const save = useMutation({
    mutationFn: (next: Record<VisibilityKey, boolean>) => updateCandidateCv(cvId, { visibility: next }),
    onSuccess: () => {
      invalidateCandidateCv(queryClient, cvId);
      toast.success("Đã cập nhật hiển thị");
    },
    onError: (error) => {
      setFlags(toFlags(visibility));
      toast.error(getApiErrorMessage(error, "Không thể cập nhật hiển thị"));
    },
  });

  return (
    <Card id="cv-visibility">
      <CardHeader>
        <CardTitle>Hiển thị với doanh nghiệp</CardTitle>
        <CardDescription>
          Tắt các mục bạn không muốn doanh nghiệp nhìn thấy trên CV này (khi xem hồ sơ, tải PDF hoặc xem đơn ứng
          tuyển).
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <div key={section.key} className="flex items-center gap-3">
            <Switch
              id={`cv-visibility-${section.key}`}
              checked={flags[section.key]}
              disabled={save.isPending}
              onCheckedChange={(checked) => {
                const next = { ...flags, [section.key]: checked };
                setFlags(next);
                save.mutate(next);
              }}
            />
            <Label htmlFor={`cv-visibility-${section.key}`} className="cursor-pointer">
              {section.label}
            </Label>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
