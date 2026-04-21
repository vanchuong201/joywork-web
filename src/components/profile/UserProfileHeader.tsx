"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { MapPin, CheckCircle, Edit3, Mail, Phone, Globe, Linkedin, Github, FileText, Sparkles, Download } from 'lucide-react';
import { PublicUserProfile } from '@/types/user';
import { useAuthStore } from '@/store/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { WardOption } from '@/lib/location-wards';

/** Khi chưa mở CV: chỉ hiển thị chữ cái đầu mỗi từ, ví dụ "Nguyễn Văn Chương" → "NVC". */
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
  /** Trang mở CV: làm mờ avatar + liên hệ cho đến khi DN xác nhận mở */
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
  const [avatarError, setAvatarError] = useState(false);
  const avatarUrl =
    !avatarError && profile.profile?.avatar
      ? profile.profile.avatar
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          showCvMask ? maskedInitials : profile.name || "User"
        )}&background=random&size=200`;
  const status = profile.profile?.status;
  const statusLabel = status ? statusLabels[status] || status : null;

  const displayTitle = showCvMask ? maskedInitials : profile.name || "User";

  // Fetch ward details for display
  const [wards, setWards] = useState<WardOption[]>([]);
  const provinceCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const w of profile.profile?.wardCodes ?? []) {
      const parts = w.split('/');
      if (parts.length === 2) codes.add(parts[0]);
    }
    return Array.from(codes);
  }, [profile.profile?.wardCodes]);

  const provinceCodesKey = provinceCodes.join(',');

  useEffect(() => {
    if (!provinceCodes.length) {
      setWards([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ data: { wards: WardOption[] } }>('/api/locations/wards', {
          params: { provinceCodes: provinceCodes.join(',') },
        });
        if (!cancelled) setWards(data.data.wards);
      } catch {
        if (!cancelled) setWards([]);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceCodesKey]);

  const wardByCode = useMemo(() => new Map(wards.map((w) => [w.code, w])), [wards]);

  // Build full address: [specificAddress] - [wardName] - [provinceName]
  const fullAddress = (() => {
    const parts: string[] = [];
    if (profile.profile?.specificAddress) parts.push(profile.profile.specificAddress);
    const firstWard = profile.profile?.wardCodes?.[0];
    if (firstWard) {
      const wardInfo = wardByCode.get(firstWard);
      if (wardInfo) {
        parts.push(wardInfo.fullName ?? wardInfo.name);
      }
    }
    if (profile.profile?.location) parts.push(profile.profile.location);
    return parts.length > 0 ? parts.join(' - ') : null;
  })();

  const maskedAddress = '••• - ••• - •••';

  // Address: [Địa chỉ cụ thể] - [Phường xã] - [Tỉnh/thành]
  const hasAddress = profile.profile?.specificAddress || profile.profile?.location || profile.profile?.wardCodes?.length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-24 opacity-10" style={{ background: `linear-gradient(to right, var(--brand), var(--brand-secondary))` }}></div>
      <div className="relative flex flex-col md:flex-row items-start gap-6 pt-4">
        <div
          className={cn(
            "w-32 h-32 rounded-full border-4 border-white shadow-lg relative -mt-4 overflow-hidden shrink-0",
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
            onError={() => setAvatarError(true)}
          />
          <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full" title="Online"></div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-slate-900 truncate">{displayTitle}</h1>
                {profile.isTalentPoolMember && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm shrink-0">
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
                {/* Address - Protected info like email/phone */}
                {hasAddress && (
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      showCvMask && "select-none blur-[5px]"
                    )}
                  >
                    <MapPin size={16} className="shrink-0" />
                    <span>
                      {showCvMask ? maskedAddress : fullAddress}
                    </span>
                  </span>
                )}
                {(showCvMask || profile.profile?.contactEmail) && (
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      showCvMask && "select-none blur-[5px]"
                    )}
                  >
                    <Mail size={16} className="shrink-0" />
                    <span className="truncate max-w-[200px]">
                      {showCvMask ? "email@••••••" : profile.profile?.contactEmail}
                    </span>
                  </span>
                )}
                {(showCvMask || profile.profile?.contactPhone) && (
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      showCvMask && "select-none blur-[5px]"
                    )}
                  >
                    <Phone size={16} className="shrink-0" />
                    <span>
                      {showCvMask ? "••• ••• •••" : profile.profile?.contactPhone}
                    </span>
                  </span>
                )}
                {(showCvMask || profile.profile?.website) && (
                  <a
                    href={showCvMask ? "#" : (profile.profile?.website || "#")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1 hover:text-[var(--brand)]",
                      showCvMask && "pointer-events-none select-none blur-[5px]"
                    )}
                  >
                    <Globe size={16} className="shrink-0" />
                    <span>{showCvMask ? "https://••••••" : "Website"}</span>
                  </a>
                )}
                {/* LinkedIn - Icon button style */}
                {(showCvMask || profile.profile?.linkedin) && (
                  <a
                    href={showCvMask ? "#" : (profile.profile?.linkedin || "#")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1 hover:text-[#0077b5]",
                      showCvMask && "pointer-events-none select-none blur-[5px]"
                    )}
                    title="LinkedIn"
                  >
                    <Linkedin size={16} className="shrink-0" fill="currentColor" />
                    <span>{showCvMask ? "••••••" : "LinkedIn"}</span>
                  </a>
                )}
                {/* GitHub - Icon button style */}
                {(showCvMask || profile.profile?.github) && (
                  <a
                    href={showCvMask ? "#" : (profile.profile?.github || "#")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1 hover:text-[#333]",
                      showCvMask && "pointer-events-none select-none blur-[5px]"
                    )}
                    title="GitHub"
                  >
                    <Github size={16} className="shrink-0" />
                    <span>{showCvMask ? "••••••" : "GitHub"}</span>
                  </a>
                )}
                {/* CV File - Download button style */}
                {(showCvMask || profile.profile?.cvUrl) && (
                  <a
                    href={showCvMask ? "#" : (profile.profile?.cvUrl || "#")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1 text-[var(--brand)] hover:underline",
                      showCvMask && "pointer-events-none select-none blur-[5px]"
                    )}
                  >
                    {showCvMask ? (
                      <>
                        <FileText size={16} className="shrink-0" />
                        <span>file-cv••••••</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} className="shrink-0" />
                        <span>Tải CV</span>
                      </>
                    )}
                  </a>
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
