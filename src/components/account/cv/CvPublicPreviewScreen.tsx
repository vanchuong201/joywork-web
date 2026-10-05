"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import PublicProfilePageContent from "@/components/profile/PublicProfilePageContent";
import { useCandidateCv, useOwnAccount } from "@/hooks/useCandidateCvs";
import { ownedCvToPublicProfile } from "@/lib/owned-cv-public-profile";

export default function CvPublicPreviewScreen({ cvId }: { cvId: string }) {
  const cvQuery = useCandidateCv(cvId);
  const accountQuery = useOwnAccount();

  if (cvQuery.isLoading || accountQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="h-40 animate-pulse rounded-2xl bg-[var(--muted)]" />
      </div>
    );
  }

  if (cvQuery.isError || !cvQuery.data) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
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

  const profile = ownedCvToPublicProfile(cvQuery.data, accountQuery.data);

  return (
    <div>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 pt-6">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/account/profile/cv/${encodeURIComponent(cvId)}`}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Quay lại chỉnh sửa
          </Link>
        </Button>
        <p className="text-sm text-[var(--muted-foreground)]">Chỉ bạn xem được trang này</p>
      </div>
      <PublicProfilePageContent profile={profile} />
    </div>
  );
}
