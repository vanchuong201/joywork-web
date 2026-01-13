"use client";

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, CheckCircle, Edit3, Mail, Phone, Globe, Linkedin, Github, FileText } from 'lucide-react';
import { PublicUserProfile } from '@/types/user';
import { useAuthStore } from '@/store/useAuth';
import { Button } from '@/components/ui/button';

interface UserProfileHeaderProps {
  profile: PublicUserProfile;
}

const statusLabels: Record<string, string> = {
  OPEN_TO_WORK: 'Đang tìm việc',
  NOT_AVAILABLE: 'Không tìm việc',
  LOOKING: 'Xem xét cơ hội',
};

export default function UserProfileHeader({ profile }: UserProfileHeaderProps) {
  const user = useAuthStore((state) => state.user);
  const isOwnProfile = user?.id === profile.id;

  const avatarUrl = profile.profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=random&size=200`;
  const status = profile.profile?.status;
  const statusLabel = status ? statusLabels[status] || status : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-24 opacity-10" style={{ background: `linear-gradient(to right, var(--brand), var(--brand-secondary))` }}></div>
      <div className="relative flex flex-col md:flex-row items-start gap-6 pt-4">
        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg relative -mt-4">
          <Image
            src={avatarUrl}
            alt={profile.name || 'Avatar'}
            width={128}
            height={128}
            className="w-full h-full rounded-full object-cover"
          />
          <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full" title="Online"></div>
        </div>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900">{profile.name || 'User'}</h1>
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
                {profile.profile?.contactEmail && (
                  <span className="flex items-center gap-1">
                    <Mail size={16} /> {profile.profile.contactEmail}
                  </span>
                )}
                {profile.profile?.contactPhone && (
                  <span className="flex items-center gap-1">
                    <Phone size={16} /> {profile.profile.contactPhone}
                  </span>
                )}
                {profile.profile?.website && (
                  <a 
                    href={profile.profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-[var(--brand)] transition-colors"
                  >
                    <Globe size={16} /> Website
                  </a>
                )}
                {profile.profile?.linkedin && (
                  <a 
                    href={profile.profile.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-[var(--brand)] transition-colors"
                  >
                    <Linkedin size={16} /> LinkedIn
                  </a>
                )}
                {profile.profile?.github && (
                  <a 
                    href={profile.profile.github} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-[var(--brand)] transition-colors"
                  >
                    <Github size={16} /> GitHub
                  </a>
                )}
                {profile.profile?.cvUrl && (
                  <a 
                    href={profile.profile.cvUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-[var(--brand)] transition-colors"
                  >
                    <FileText size={16} /> CV
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

