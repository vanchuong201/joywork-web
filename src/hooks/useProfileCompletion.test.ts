import { describe, expect, it } from "vitest";
import { buildCvApplyReadiness } from "@/hooks/useProfileCompletion";
import type { OwnUserProfile } from "@/types/user";

function createProfile(params: {
  knowledge?: string[];
  skills?: string[];
  attitude?: string[];
  experiencesCount?: number;
  includeBasicInfo?: boolean;
}): OwnUserProfile {
  const experiencesCount = params.experiencesCount ?? 0;
  const includeBasicInfo = params.includeBasicInfo ?? false;

  return {
    id: "user_1",
    email: "user@example.com",
    phone: includeBasicInfo ? "0901234567" : undefined,
    avatar: includeBasicInfo ? "https://example.com/avatar.jpg" : undefined,
    name: includeBasicInfo ? "Nguyen Van A" : undefined,
    profile: {
      id: "profile_1",
      userId: "user_1",
      skills: params.skills ?? [],
      knowledge: params.knowledge ?? [],
      attitude: params.attitude ?? [],
      fullName: includeBasicInfo ? "Nguyen Van A" : undefined,
      title: includeBasicInfo ? "Developer" : undefined,
      bio: includeBasicInfo ? "Bio" : undefined,
      contactEmail: includeBasicInfo ? "user@example.com" : undefined,
      contactPhone: includeBasicInfo ? "0901234567" : undefined,
      avatar: includeBasicInfo ? "https://example.com/avatar.jpg" : undefined,
      locations: includeBasicInfo ? ["01"] : [],
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
  it("trả về chưa sẵn sàng khi thiếu cả ba mục", () => {
    const result = buildCvApplyReadiness(createProfile({ experiencesCount: 0 }));

    expect(result.isReady).toBe(false);
    expect(result.missingItems).toEqual([
      "Thông tin cơ bản",
      "Năng lực (KSA)",
      "Kinh nghiệm làm việc",
    ]);
  });

  it("trả về chưa sẵn sàng khi chỉ có thông tin cơ bản", () => {
    const result = buildCvApplyReadiness(
      createProfile({
        includeBasicInfo: true,
        experiencesCount: 0,
      })
    );

    expect(result.isReady).toBe(false);
    expect(result.hasBasicInfo).toBe(true);
    expect(result.hasKsa).toBe(false);
    expect(result.hasExperiences).toBe(false);
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
    expect(result.missingItems).toEqual(["Thông tin cơ bản", "Kinh nghiệm làm việc"]);
  });

  it("trả về chưa sẵn sàng khi có kinh nghiệm nhưng thiếu KSA", () => {
    const result = buildCvApplyReadiness(createProfile({ experiencesCount: 1 }));

    expect(result.isReady).toBe(false);
    expect(result.hasKsa).toBe(false);
    expect(result.hasExperiences).toBe(true);
    expect(result.missingItems).toEqual(["Thông tin cơ bản", "Năng lực (KSA)"]);
  });

  it("trả về sẵn sàng khi có đủ thông tin cơ bản, KSA và kinh nghiệm", () => {
    const result = buildCvApplyReadiness(
      createProfile({
        includeBasicInfo: true,
        attitude: ["Cầu tiến"],
        experiencesCount: 1,
      })
    );

    expect(result.isReady).toBe(true);
    expect(result.hasBasicInfo).toBe(true);
    expect(result.hasKsa).toBe(true);
    expect(result.hasExperiences).toBe(true);
    expect(result.missingItems).toEqual([]);
  });
});
