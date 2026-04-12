import { PublicUserProfile } from "@/types/user";
import UserProfileHeader from "@/components/profile/UserProfileHeader";
import UserProfileKSA from "@/components/profile/UserProfileKSA";
import UserProfileExpectations from "@/components/profile/UserProfileExpectations";
import UserProfileEducation from "@/components/profile/UserProfileEducation";
import UserProfileBio from "@/components/profile/UserProfileBio";
import UserProfileExperience from "@/components/profile/UserProfileExperience";

type Props = {
  profile: PublicUserProfile;
  /** Trang /candidates: làm mờ liên hệ trong header */
  cvFlipHeader?: {
    enabled: boolean;
    revealed: boolean;
  };
  className?: string;
};

export default function PublicProfilePageContent({ profile, cvFlipHeader, className }: Props) {
  const visibility = profile.profile?.visibility || {
    bio: true,
    experience: true,
    education: true,
    ksa: true,
    expectations: true,
  };

  return (
    <div className={className ?? "min-h-screen bg-slate-50 pb-20"}>
      <div className="mx-auto mt-8 max-w-5xl animate-fade-in-up px-4">
        <UserProfileHeader profile={profile} cvFlip={cvFlipHeader} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            {visibility.ksa && (
              <UserProfileKSA
                knowledge={profile.profile?.knowledge || []}
                skills={profile.profile?.skills || []}
                attitude={profile.profile?.attitude || []}
              />
            )}

            {visibility.expectations && (
              <UserProfileExpectations
                expectedSalaryMin={profile.profile?.expectedSalaryMin}
                expectedSalaryMax={profile.profile?.expectedSalaryMax}
                salaryCurrency={profile.profile?.salaryCurrency}
                workMode={profile.profile?.workMode}
                expectedCulture={profile.profile?.expectedCulture}
              />
            )}

            {visibility.education && profile.educations && profile.educations.length > 0 && (
              <UserProfileEducation educations={profile.educations} />
            )}
          </div>

          <div className="space-y-6 lg:col-span-2">
            {visibility.bio && (
              <UserProfileBio bio={profile.profile?.bio} careerGoals={profile.profile?.careerGoals || []} />
            )}

            {visibility.experience && profile.experiences && profile.experiences.length > 0 && (
              <UserProfileExperience experiences={profile.experiences} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
