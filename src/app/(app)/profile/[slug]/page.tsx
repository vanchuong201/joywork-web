import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import api from '@/lib/api';
import { PublicUserProfile } from '@/types/user';
import PublicProfilePageContent from '@/components/profile/PublicProfilePageContent';

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const res = await api.get(`/api/users/profile/${slug}`);
    const profile = res.data.data.profile as PublicUserProfile;
    
    return {
      title: `${profile.name || 'User'} - Profile | JOYWORK`,
      description: profile.profile?.headline || profile.profile?.bio || 'User profile on JOYWORK',
    };
  } catch {
    return {
      title: 'Profile Not Found | JOYWORK',
    };
  }
}

export default async function UserProfilePage({ params }: Props) {
  const { slug } = await params;

  let profile: PublicUserProfile | null = null;

  try {
    const res = await api.get(`/api/users/profile/${slug}`);
    profile = res.data.data.profile as PublicUserProfile;
  } catch (error: any) {
    if (error.response?.status === 404) {
      notFound();
    }
    throw error;
  }

  if (!profile) {
    notFound();
  }

  return <PublicProfilePageContent profile={profile} />;
}

