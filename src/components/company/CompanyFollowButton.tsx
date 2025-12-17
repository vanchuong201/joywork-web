"use client";

import { useState, useMemo, useEffect } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";

type Props = {
  companyId: string;
  companySlug: string;
  initialFollowers?: number;
  showCount?: boolean;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
};

export default function CompanyFollowButton({
  companyId,
  companySlug,
  initialFollowers = 0,
  showCount = false,
  className,
  variant = "outline",
  size = "sm",
}: Props) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const loading = useAuthStore((state) => state.loading);
  const followedCompanies = useAuthStore((state) => state.followedCompanies);
  const addFollowedCompany = useAuthStore((state) => state.addFollowedCompany);
  const removeFollowedCompany = useAuthStore((state) => state.removeFollowedCompany);
  const { openPrompt } = useAuthPrompt();

  const isFollowing = useMemo(
    () => followedCompanies.some((entry) => entry.companyId === companyId),
    [followedCompanies, companyId],
  );

  const [followers, setFollowers] = useState(initialFollowers);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFollowers(initialFollowers);
  }, [initialFollowers]);

  const handleAction = async () => {
    if (!initialized || loading) return;
    if (!user) {
      openPrompt("follow");
      return;
    }

    setSubmitting(true);
    try {
      if (isFollowing) {
        await api.delete(`/api/companies/${companyId}/follow`);
        removeFollowedCompany(companyId);
        setFollowers((prev) => Math.max(prev - 1, 0));
      } else {
        await api.post(`/api/companies/${companyId}/follow`);
        addFollowedCompany({ companyId, slug: companySlug });
        setFollowers((prev) => prev + 1);
      }
    } catch (error: any) {
      const message = error?.response?.data?.error?.message ?? "Không thể cập nhật theo dõi. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const Icon = isFollowing ? Check : Plus;
  const followerLabel = followers.toLocaleString("vi-VN");

  const isOutline = variant === "outline" || variant === "ghost";

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAction}
      disabled={isSubmitting || loading}
      className={cn(
        "gap-1", 
        className, 
        isFollowing && isOutline ? "border-[var(--brand)] text-[var(--brand)]" : undefined
      )}
    >
      <Icon className="h-4 w-4" />
      {isFollowing ? "Đang theo dõi" : "Theo dõi"}
      {showCount ? (
        <span className="ml-2 text-xs text-[var(--muted-foreground)]">· {followerLabel}</span>
      ) : null}
    </Button>
  );
}

