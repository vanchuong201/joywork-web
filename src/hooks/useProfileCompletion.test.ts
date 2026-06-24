import { describe, expect, it } from "vitest";
import { buildCvApplyReadiness } from "@/hooks/useProfileCompletion";
import type { OwnUserProfile } from "@/types/user";

function createProfile(params: {
  knowledge?: string[];
  skills?: string[];
  attitude?: string[];
  experiencesCount?: number;
}): OwnUserProfile {
  const experiencesCount = params.experiencesCount ?? 0;
  return {
    id: "user_1",
    email: "user@example.com",
    profile: {
      id: "profile_1",
      userId: "user_1",
      skills: params.skills ?? [],
      knowledge: params.knowledge ?? [],
      attitude: params.attitude ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    experiences: Array.from({ length: experiencesCount }).map((_, index) => ({
      id: `exp_${index}`,
      role: "Developer",
      company: "JoyWork",
      achievements: [],
      order: index,
    })),
    educations: [],
    createdAt: new Date().toISOString(),
  };
}

describe("buildCvApplyReadiness", () => {
  it("trả về chưa sẵn sàng khi thiếu cả KSA và kinh nghiệm", () => {
    const result = buildCvApplyReadiness(createProfile({ experiencesCount: 0 }));

    expect(result.isReady).toBe(false);
    expect(result.missingItems).toEqual(["Năng lực (KSA)", "Kinh nghiệm làm việc"]);
  });

  it("trả về chưa sẵn sàng khi có KSA nhưng thiếu kinh nghiệm", () => {
    const result = buildCvApplyReadiness(
      createProfile({
        knowledge: ["JavaScript"],
        experiencesCount: 0,
      })
    );

    expect(result.isReady).toBe(false);
    expect(result.hasKsa).toBe(true);
    expect(result.hasExperiences).toBe(false);
    expect(result.missingItems).toEqual(["Kinh nghiệm làm việc"]);
  });

  it("trả về chưa sẵn sàng khi có kinh nghiệm nhưng thiếu KSA", () => {
    const result = buildCvApplyReadiness(createProfile({ experiencesCount: 1 }));

    expect(result.isReady).toBe(false);
    expect(result.hasKsa).toBe(false);
    expect(result.hasExperiences).toBe(true);
    expect(result.missingItems).toEqual(["Năng lực (KSA)"]);
  });

  it("trả về sẵn sàng khi có đủ KSA và kinh nghiệm", () => {
    const result = buildCvApplyReadiness(
      createProfile({
        attitude: ["Cầu tiến"],
        experiencesCount: 1,
      })
    );

    expect(result.isReady).toBe(true);
    expect(result.missingItems).toEqual([]);
  });
});
