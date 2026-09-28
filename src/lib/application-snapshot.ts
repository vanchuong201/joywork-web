import type { CvSnapshot } from "@/types/application";
import type { PublicUserProfile, UserProfileVisibility } from "@/types/user";

type PublicProfileData = NonNullable<PublicUserProfile["profile"]>;

const VISIBILITY_KEYS = ["bio", "experience", "education", "ksa", "expectations"] as const;

function normalizeVisibility(visibility: Record<string, boolean> | null | undefined): UserProfileVisibility {
  const result: Record<string, boolean> = {};
  for (const key of VISIBILITY_KEYS) {
    result[key] = visibility?.[key] !== false;
  }
  return result as UserProfileVisibility;
}

/** Map snapshot CV của đơn sang shape `PublicUserProfile` để tái dùng các khối hiển thị hồ sơ. */
export function snapshotToPublicProfile(snapshot: CvSnapshot): PublicUserProfile {
  const content = snapshot.content;
  return {
    id: snapshot.account.id,
    name: content.fullName || snapshot.account.name || null,
    slug: snapshot.account.slug,
    createdAt: snapshot.capturedAt,
    profile: {
      id: snapshot.cvId,
      avatar: content.avatar,
      fullName: content.fullName,
      title: content.title,
      headline: content.headline,
      locations: content.locations ?? [],
      wardCodes: content.wardCodes ?? [],
      specificAddress: content.specificAddress,
      website: content.website,
      linkedin: content.linkedin,
      github: content.github,
      cvUrl: content.cvUrl,
      contactEmail: content.contactEmail || snapshot.account.email || null,
      contactPhone: content.contactPhone || snapshot.account.phone || null,
      bio: content.bio,
      knowledge: content.knowledge ?? [],
      skills: content.skills ?? [],
      attitude: content.attitude ?? [],
      expectedSalaryMin: content.expectedSalaryMin,
      expectedSalaryMax: content.expectedSalaryMax,
      salaryCurrency: content.salaryCurrency,
      workMode: content.workMode,
      expectedCulture: content.expectedCulture,
      careerGoals: content.careerGoals ?? [],
      visibility: normalizeVisibility(content.visibility),
      gender: content.gender as PublicProfileData["gender"],
      dayOfBirth: content.dayOfBirth,
      monthOfBirth: content.monthOfBirth,
      yearOfBirth: content.yearOfBirth,
      educationLevel: content.educationLevel as PublicProfileData["educationLevel"],
    },
    experiences: snapshot.experiences ?? [],
    educations: snapshot.educations ?? [],
  };
}
