import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import api from '@/lib/api';
import { PublicUserProfile } from '@/types/user';
import UserProfileHeader from '@/components/profile/UserProfileHeader';
import UserProfileKSA from '@/components/profile/UserProfileKSA';
import UserProfileExpectations from '@/components/profile/UserProfileExpectations';
import UserProfileEducation from '@/components/profile/UserProfileEducation';
import UserProfileBio from '@/components/profile/UserProfileBio';
import UserProfileExperience from '@/components/profile/UserProfileExperience';

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
      title: `${profile.name || 'User'} - Profile | JoyWork`,
      description: profile.profile?.headline || profile.profile?.bio || 'User profile on JoyWork',
    };
  } catch {
    return {
      title: 'Profile Not Found | JoyWork',
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

  const visibility = profile.profile?.visibility || {
    bio: true,
    experience: true,
    education: true,
    ksa: true,
    expectations: true,
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-5xl mx-auto px-4 mt-8 animate-fade-in-up">
        {/* Profile Header */}
        <UserProfileHeader profile={profile} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Matching Data (KSA) */}
          <div className="lg:col-span-1 space-y-6">
            {/* KSA Card */}
            {visibility.ksa && (
              <UserProfileKSA
                knowledge={profile.profile?.knowledge || []}
                skills={profile.profile?.skills || []}
                attitude={profile.profile?.attitude || []}
              />
            )}

            {/* Expectations Card */}
            {visibility.expectations && (
              <UserProfileExpectations
                expectedSalary={profile.profile?.expectedSalary}
                workMode={profile.profile?.workMode}
                expectedCulture={profile.profile?.expectedCulture}
              />
            )}

            {/* Education Card */}
            {visibility.education && profile.educations && profile.educations.length > 0 && (
              <UserProfileEducation educations={profile.educations} />
            )}
          </div>

          {/* RIGHT COLUMN: Experience & Bio */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio / Mission */}
            {visibility.bio && (
              <UserProfileBio
                bio={profile.profile?.bio}
                careerGoals={profile.profile?.careerGoals || []}
              />
            )}

            {/* Experience Timeline */}
            {visibility.experience && profile.experiences && profile.experiences.length > 0 && (
              <UserProfileExperience experiences={profile.experiences} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

