"use client";

import { useMemo, useState } from "react";
import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuth";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";

type JobSaveButtonProps = {
  jobId: string;
  className?: string;
  showLabel?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
};

export default function JobSaveButton({
  jobId,
  className,
  showLabel = true,
  size = "sm",
}: JobSaveButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const loading = useAuthStore((state) => state.loading);
  const savedJobIds = useAuthStore((state) => state.savedJobIds);
  const addSavedJob = useAuthStore((state) => state.addSavedJob);
  const removeSavedJob = useAuthStore((state) => state.removeSavedJob);
  const { openPrompt } = useAuthPrompt();

  const [isSubmitting, setSubmitting] = useState(false);

  const isSaved = useMemo(() => savedJobIds.includes(jobId), [savedJobIds, jobId]);

  const handleToggle = async () => {
    if (!initialized || loading || isSubmitting) return;

    if (!user) {
      openPrompt("save-job");
      return;
    }

    setSubmitting(true);
    try {
      if (isSaved) {
        await api.delete(`/api/jobs/${jobId}/favorite`);
        removeSavedJob(jobId);
      } else {
        await api.post(`/api/jobs/${jobId}/favorite`);
        addSavedJob(jobId);
      }
      queryClient.invalidateQueries({ queryKey: ["job-favorites"] });
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? "Không thể cập nhật danh sách việc đã lưu.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const Icon = isSaved ? BookmarkCheck : BookmarkPlus;

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleToggle}
      disabled={loading || isSubmitting}
      className={cn("gap-1", isSaved ? "border-[var(--brand)] text-[var(--brand)]" : undefined, className)}
    >
      <Icon className={cn(size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
      {showLabel ? (isSaved ? "Đã lưu" : "Lưu việc") : null}
    </Button>
  );
}


