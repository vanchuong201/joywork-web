import { getProvinceNameByCode } from "@/lib/provinces";
import type { CandidateCvDetail, OwnAccount } from "@/types/candidate-cv";
import type { PublicUserProfile, UserProfileVisibility } from "@/types/user";

const VISIBILITY_KEYS = ["bio", "experience", "education", "ksa", "expectations"] as const;

function normalizeVisibility(visibility?: UserProfileVisibility | null): UserProfileVisibility {
  const result: Record<string, boolean> = {};
  for (const key of VISIBILITY_KEYS) {
    result[key] = visibility?.[key] !== false;
  }
  return result as UserProfileVisibility;
}

/** CV của chính chủ, xem trước như hồ sơ công khai. Không gắn trạng thái tìm việc hay luồng mở CV. */
export function ownedCvToPublicProfile(
  cv: CandidateCvDetail,
  account?: OwnAccount | null,
): PublicUserProfile {
  const locationCode = cv.locations?.[0];
  const fullName = cv.fullName?.trim() || null;

  return {
    id: cv.id,
    name: fullName || account?.name || null,
    slug: account?.slug ?? null,
    createdAt: cv.createdAt,
    profile: {
      id: cv.id,
      avatar: cv.avatar,
      fullName,
      title: cv.title,
      headline: cv.headline,
      locations: cv.locations ?? [],
      wardCodes: cv.wardCodes ?? [],
      specificAddress: cv.specificAddress,
      location: getProvinceNameByCode(locationCode) ?? locationCode ?? null,
      website: cv.website,
      linkedin: cv.linkedin,
      github: cv.github,
      cvUrl: cv.cvUrl,
      contactEmail: cv.contactEmail || account?.email || null,
      contactPhone: cv.contactPhone || account?.phone || null,
      bio: cv.bio,
      knowledge: cv.knowledge ?? [],
      skills: cv.skills ?? [],
      attitude: cv.attitude ?? [],
      expectedSalaryMin: cv.expectedSalaryMin,
      expectedSalaryMax: cv.expectedSalaryMax,
      salaryCurrency: cv.salaryCurrency,
      workMode: cv.workMode,
      expectedCulture: cv.expectedCulture,
      careerGoals: cv.careerGoals ?? [],
      visibility: normalizeVisibility(cv.visibility),
      gender: cv.gender,
      dayOfBirth: cv.dayOfBirth,
      monthOfBirth: cv.monthOfBirth,
      yearOfBirth: cv.yearOfBirth,
      educationLevel: cv.educationLevel,
    },
    experiences: cv.experiences ?? [],
    educations: cv.educations ?? [],
  };
}
