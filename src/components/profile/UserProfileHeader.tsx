"use client";

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, CheckCircle, Edit3, Mail, Phone, Globe, Linkedin, Github, FileText, Sparkles } from 'lucide-react';
import { PublicUserProfile } from '@/types/user';
import { useAuthStore } from '@/store/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Khi chưa lật CV: chỉ hiển thị chữ cái đầu mỗi từ, ví dụ "Nguyễn Văn Chương" → "NVC". */
function nameToMaskedInitials(name: string | null | undefined): string {
  const raw = (name || "Ứng viên").trim();
  const parts = raw.split(/\s+/).filter((p) => p.length > 0);
  if (parts.length === 0) return "?";
  return parts
    .map((word) => {
      const ch = Array.from(word)[0] ?? "";
      return ch.toLocaleUpperCase("vi-VN");
    })
    .join("");
}

interface UserProfileHeaderProps {
  profile: PublicUserProfile;
  /** Trang lật CV: làm mờ avatar + liên hệ cho đến khi DN xác nhận lật */
  cvFlip?: {
    enabled: boolean;
    revealed: boolean;
  };
}

const statusLabels: Record<string, string> = {
  OPEN_TO_WORK: 'Đang tìm việc',
  NOT_AVAILABLE: 'Không tìm việc',
  LOOKING: 'Xem xét cơ hội',
};

export default function UserProfileHeader({ profile, cvFlip }: UserProfileHeaderProps) {
  const user = useAuthStore((state) => state.user);
  const isOwnProfile = user?.id === profile.id;

  const showCvMask = Boolean(cvFlip?.enabled && !cvFlip.revealed);

  const maskedInitials = nameToMaskedInitials(profile.name);
  const avatarUrl =
    profile.profile?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      showCvMask ? maskedInitials : profile.name || "User"
    )}&background=random&size=200`;
  const status = profile.profile?.status;
  const statusLabel = status ? statusLabels[status] || status : null;

  const displayTitle = showCvMask ? maskedInitials : profile.name || "User";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-24 opacity-10" style={{ background: `linear-gradient(to right, var(--brand), var(--brand-secondary))` }}></div>
      <div className="relative flex flex-col md:flex-row items-start gap-6 pt-4">
        <div
          className={cn(
            "w-32 h-32 rounded-full border-4 border-white shadow-lg relative -mt-4 overflow-hidden",
            showCvMask && "ring-2 ring-slate-200"
          )}
        >
          <Image
            src={avatarUrl}
            alt={profile.name || 'Avatar'}
            width={128}
            height={128}
            className={cn(
              "w-full h-full rounded-full object-cover",
              showCvMask && "scale-110 blur-md"
            )}
          />
          <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full" title="Online"></div>
        </div>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-900">{displayTitle}</h1>
                {profile.isTalentPoolMember && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">
                    <Sparkles size={14} /> Talent Pool
                  </span>
                )}
              </div>
              {profile.profile?.title && (
                <p className="text-lg text-slate-600 font-medium mb-2">{profile.profile.title}</p>
              )}
              {profile.profile?.headline && (
                <p className="text-base text-slate-500 mb-3">{profile.profile.headline}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                {profile.profile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={16} /> {profile.profile.location}
                  </span>
                )}
                {(showCvMask || profile.profile?.contactEmail) && (
                  <span
                    className={cn(
                      "flex max-w-[min(100%,280px)] items-center gap-1",
                      showCvMask && "select-none blur-[5px]"
                    )}
                  >
                    <Mail size={16} className="shrink-0" />
                    <span className="truncate">
                      {showCvMask ? "email@••••••" : profile.profile?.contactEmail}
                    </span>
                  </span>
                )}
                {(showCvMask || profile.profile?.contactPhone) && (
                  <span
                    className={cn(
                      "flex max-w-[min(100%,220px)] items-center gap-1",
                      showCvMask && "select-none blur-[5px]"
                    )}
                  >
                    <Phone size={16} className="shrink-0" />
                    <span className="truncate">
                      {showCvMask ? "••• ••• •••" : profile.profile?.contactPhone}
                    </span>
                  </span>
                )}
                {(showCvMask || profile.profile?.website) && (
                  <span
                    className={cn(
                      "flex max-w-full min-w-0 items-start gap-1 break-all",
                      showCvMask && "select-none blur-[5px]",
                      !showCvMask && "text-slate-700"
                    )}
                  >
                    <Globe size={16} className="mt-0.5 shrink-0" />
                    {showCvMask ? (
                      <span>https://••••••</span>
                    ) : (
                      <a
                        href={profile.profile?.website || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[var(--brand)]"
                      >
                        {profile.profile?.website}
                      </a>
                    )}
                  </span>
                )}
                {(showCvMask || profile.profile?.linkedin) && (
                  <span
                    className={cn(
                      "flex max-w-full min-w-0 items-start gap-1 break-all",
                      showCvMask && "select-none blur-[5px]",
                      !showCvMask && "text-slate-700"
                    )}
                  >
                    <Linkedin size={16} className="mt-0.5 shrink-0" />
                    {showCvMask ? (
                      <span>linkedin.com/in/••••••</span>
                    ) : (
                      <a
                        href={profile.profile?.linkedin || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[var(--brand)]"
                      >
                        {profile.profile?.linkedin}
                      </a>
                    )}
                  </span>
                )}
                {(showCvMask || profile.profile?.github) && (
                  <span
                    className={cn(
                      "flex max-w-full min-w-0 items-start gap-1 break-all",
                      showCvMask && "select-none blur-[5px]",
                      !showCvMask && "text-slate-700"
                    )}
                  >
                    <Github size={16} className="mt-0.5 shrink-0" />
                    {showCvMask ? (
                      <span>github.com/••••••</span>
                    ) : (
                      <a
                        href={profile.profile?.github || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[var(--brand)]"
                      >
                        {profile.profile?.github}
                      </a>
                    )}
                  </span>
                )}
                {(showCvMask || profile.profile?.cvUrl) && (
                  <span
                    className={cn(
                      "flex max-w-[min(100%,320px)] items-center gap-1",
                      showCvMask && "select-none blur-[5px]"
                    )}
                  >
                    <FileText size={16} className="shrink-0" />
                    {showCvMask ? (
                      <span className="truncate text-slate-500">file-cv••••••</span>
                    ) : (
                      <a
                        href={profile.profile?.cvUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-[var(--brand)] hover:underline"
                      >
                        {profile.profile?.cvUrl}
                      </a>
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {statusLabel && (
                <span className="px-4 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-sm font-bold text-center inline-flex items-center justify-center gap-1">
                  <CheckCircle size={14} /> {statusLabel}
                </span>
              )}
              {isOwnProfile && (
                <Link href="/account/profile">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Edit3 size={16} /> Chỉnh sửa hồ sơ
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

