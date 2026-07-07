"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { MapPin, Edit3, Mail, Phone, Globe, Linkedin, Github, Sparkles, Cake, Lock } from 'lucide-react';
import { PublicUserProfile } from '@/types/user';
import { useAuthStore } from '@/store/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { WardOption } from '@/lib/location-wards';
import JobSeekingStatusBadge from '@/components/candidates/JobSeekingStatusBadge';

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
  /** Trang /candidates/:slug — hiển thị đầy đủ trạng thái tìm việc cho nhà tuyển dụng */
  employerCandidateView?: boolean;
}

export default function UserProfileHeader({ profile, cvFlip, employerCandidateView = false }: UserProfileHeaderProps) {
  const user = useAuthStore((state) => state.user);
  const isOwnProfile = user?.id === profile.id;

  const showCvMask = Boolean(cvFlip?.enabled && !cvFlip.revealed);

  const maskedInitials = profile.maskedInitials || nameToMaskedInitials(profile.name);
  const maskedFields = profile.maskedFields;
  const hasMaskedField = (field: keyof NonNullable<PublicUserProfile['maskedFields']>) =>
    maskedFields ? maskedFields[field] : true;
  const [avatarError, setAvatarError] = useState(false);
  const avatarFallbackName = showCvMask ? maskedInitials : profile.name || "Ứng viên";
  const avatarUrl =
    !avatarError && profile.profile?.avatar
      ? profile.profile.avatar
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          avatarFallbackName
        )}&background=random&size=200`;
  const jobSeekingStatus = profile.profile?.status;

  const displayTitle = showCvMask ? maskedInitials : profile.name || "Ứng viên";

  // Fetch ward details for display
  const [wards, setWards] = useState<WardOption[]>([]);
  // Extract province codes from ward codes (must be in "provinceCode/wardCode" format)
  const provinceCodes = useMemo(() => {
    const codes = new Set<string>();
    for (const w of profile.profile?.wardCodes ?? []) {
      const parts = w.split("/");
      if (parts.length === 2 && parts[0] && parts[1]) codes.add(parts[0]);
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
    // Only process ward if it's in valid "provinceCode/wardCode" format
    if (firstWard && firstWard.includes("/")) {
      const wardInfo = wardByCode.get(firstWard);
      if (wardInfo) {
        parts.push(wardInfo.fullName ?? wardInfo.name);
      }
    }
    if (profile.profile?.location) parts.push(profile.profile.location);
    return parts.length > 0 ? parts.join(" - ") : null;
  })();

  const maskedAddress = '••• - ••• - •••';

  // Address: [Địa chỉ cụ thể] - [Phường xã] - [Tỉnh/thành]
  // Only show if there's actual address data (check for valid ward code format too)
  const hasAddress = profile.profile?.specificAddress || profile.profile?.location || (profile.profile?.wardCodes?.[0]?.includes("/") ?? false);

  // Build full date of birth display
  const fullDateOfBirth = (() => {
    const day = profile.profile?.dayOfBirth;
    const month = profile.profile?.monthOfBirth;
    const year = profile.profile?.yearOfBirth;
    if (!year || year === 0) return null;
    const parts: string[] = [];
    if (day && day > 0) parts.push(String(day));
    if (month && month > 0) parts.push(String(month));
    parts.push(String(year));
    return parts.join('/');
  })();

  const hasDateOfBirth = !!(profile.profile?.yearOfBirth && profile.profile.yearOfBirth > 0);

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
          {showCvMask ? (
            <div
              className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-2xl font-black tracking-wide text-slate-500 select-none"
              title="Thông tin đang được ẩn"
            >
              <span className="blur-[1.5px]">{maskedInitials}</span>
              <span className="absolute inset-0 flex items-center justify-center">
                <Lock size={28} className="text-slate-500/80" />
              </span>
            </div>
          ) : (
            <>
              <Image
                src={avatarUrl}
                alt={profile.name || 'Avatar'}
                width={128}
                height={128}
                className="w-full h-full rounded-full object-cover"
                unoptimized={avatarUrl.includes('ui-avatars.com')}
                onError={() => setAvatarError(true)}
              />
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full" title="Online"></div>
            </>
          )}
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
              {showCvMask && (
                <p className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                  <Lock size={12} /> Thông tin CV đang được ẩn - Để xem thông tin vui long bấm vào "Xem thông tin" ở cuối trang
                </p>
              )}
              {profile.profile?.title && (
                <p className="text-lg text-slate-600 font-medium mb-2">{profile.profile.title}</p>
              )}
              {profile.profile?.headline && (
                <p className="text-base text-slate-500 mb-3">{profile.profile.headline}</p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                {/* Address */}
                {((showCvMask && hasMaskedField('address')) || (!showCvMask && hasAddress)) && (
                  <span
                    className={cn(
                      "flex min-w-0 max-w-full items-start gap-1",
                      showCvMask && "select-none"
                    )}
                  >
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    <span className={cn(!showCvMask && "break-words select-text", showCvMask && "blur-[5px]")}>
                      {showCvMask ? maskedAddress : fullAddress}
                    </span>
                  </span>
                )}
                {/* Date of Birth */}
                {((showCvMask && hasMaskedField('dateOfBirth')) || (!showCvMask && hasDateOfBirth)) && (
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      showCvMask && "select-none"
                    )}
                  >
                    <Cake size={16} className="shrink-0" />
                    <span className={cn(!showCvMask && "select-text", showCvMask && "blur-[5px]")}>
                      {showCvMask ? "••/••/••••" : fullDateOfBirth}
                    </span>
                  </span>
                )}
                {/* Email */}
                {((showCvMask && hasMaskedField('contactEmail')) || (!showCvMask && profile.profile?.contactEmail)) && (
                  showCvMask ? (
                    <span className="flex items-center gap-1 select-none">
                      <Mail size={16} className="shrink-0" />
                      <span className="blur-[5px]">email@••••••</span>
                    </span>
                  ) : (
                    <a
                      href={`mailto:${profile.profile?.contactEmail}`}
                      className="flex min-w-0 max-w-full items-start gap-1 break-all select-text hover:text-[var(--brand)]"
                    >
                      <Mail size={16} className="mt-0.5 shrink-0" />
                      <span>{profile.profile?.contactEmail}</span>
                    </a>
                  )
                )}
                {/* Phone */}
                {((showCvMask && hasMaskedField('contactPhone')) || (!showCvMask && profile.profile?.contactPhone)) && (
                  showCvMask ? (
                    <span className="flex items-center gap-1 select-none">
                      <Phone size={16} className="shrink-0" />
                      <span className="blur-[5px]">••• ••• •••</span>
                    </span>
                  ) : (
                    <a
                      href={`tel:${profile.profile?.contactPhone}`}
                      className="flex min-w-0 max-w-full items-start gap-1 break-all select-text hover:text-[var(--brand)]"
                    >
                      <Phone size={16} className="mt-0.5 shrink-0" />
                      <span>{profile.profile?.contactPhone}</span>
                    </a>
                  )
                )}
                {/* Website */}
                {((showCvMask && hasMaskedField('website')) || (!showCvMask && profile.profile?.website)) && (
                  <a
                    href={showCvMask ? "#" : (profile.profile?.website || "#")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex min-w-0 max-w-full items-start gap-1",
                      !showCvMask && "break-all select-text hover:text-[var(--brand)]",
                      showCvMask && "pointer-events-none select-none"
                    )}
                  >
                    <Globe size={16} className="mt-0.5 shrink-0" />
                    <span className={cn(showCvMask && "blur-[5px]")}>
                      {showCvMask ? "https://••••••" : profile.profile?.website}
                    </span>
                  </a>
                )}
                {/* LinkedIn */}
                {((showCvMask && hasMaskedField('linkedin')) || (!showCvMask && profile.profile?.linkedin)) && (
                  <a
                    href={showCvMask ? "#" : (profile.profile?.linkedin || "#")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1 hover:text-[#0077b5]",
                      showCvMask && "pointer-events-none select-none"
                    )}
                    title="LinkedIn"
                  >
                    <Linkedin size={16} className="shrink-0" fill="currentColor" />
                    <span className={cn(showCvMask && "blur-[5px]")}>{showCvMask ? "••••••" : "LinkedIn"}</span>
                  </a>
                )}
                {/* GitHub */}
                {((showCvMask && hasMaskedField('github')) || (!showCvMask && profile.profile?.github)) && (
                  <a
                    href={showCvMask ? "#" : (profile.profile?.github || "#")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1 hover:text-[#333]",
                      showCvMask && "pointer-events-none select-none"
                    )}
                    title="GitHub"
                  >
                    <Github size={16} className="shrink-0" />
                    <span className={cn(showCvMask && "blur-[5px]")}>{showCvMask ? "••••••" : "GitHub"}</span>
                  </a>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 items-stretch sm:items-end">
              {(employerCandidateView || jobSeekingStatus) ? (
                <JobSeekingStatusBadge
                  status={jobSeekingStatus}
                  employerView={employerCandidateView}
                />
              ) : null}
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
