import { describe, expect, it } from "vitest";

import { snapshotToPublicProfile } from "@/lib/application-snapshot";
import type { CvSnapshot } from "@/types/application";

function buildSnapshot(overrides: Partial<CvSnapshot["content"]> = {}): CvSnapshot {
  return {
    version: 1,
    source: "apply",
    capturedAt: "2026-09-01T03:00:00.000Z",
    cvId: "cv-1",
    cvName: "CV Backend",
    account: { id: "user-1", name: "Tài khoản", email: "acc@example.com", phone: "0900000000", slug: "ung-vien" },
    content: {
      avatar: null,
      fullName: "Nguyễn Văn A",
      title: "Backend Developer",
      headline: null,
      bio: "Giới thiệu",
      skills: ["Node.js"],
      knowledge: [],
      attitude: [],
      cvUrl: null,
      locations: ["01"],
      wardCodes: [],
      specificAddress: null,
      website: null,
      linkedin: null,
      github: null,
      contactEmail: null,
      contactPhone: null,
      visibility: null,
      expectedSalaryMin: null,
      expectedSalaryMax: null,
      salaryCurrency: null,
      workMode: null,
      expectedCulture: null,
      careerGoals: [],
      gender: null,
      dayOfBirth: null,
      monthOfBirth: null,
      yearOfBirth: null,
      educationLevel: null,
      ...overrides,
    },
    experiences: [],
    educations: [],
  };
}

describe("snapshotToPublicProfile", () => {
  it("dùng tên trên CV và fallback liên hệ về tài khoản", () => {
    const profile = snapshotToPublicProfile(buildSnapshot());
    expect(profile.id).toBe("user-1");
    expect(profile.name).toBe("Nguyễn Văn A");
    expect(profile.profile?.contactEmail).toBe("acc@example.com");
    expect(profile.profile?.contactPhone).toBe("0900000000");
    expect(profile.profile?.skills).toEqual(["Node.js"]);
  });

  it("ưu tiên liên hệ trên CV", () => {
    const profile = snapshotToPublicProfile(buildSnapshot({ contactEmail: "cv@example.com" }));
    expect(profile.profile?.contactEmail).toBe("cv@example.com");
  });

  it("chuẩn hóa visibility: thiếu key coi như hiển thị, false thì ẩn", () => {
    const profile = snapshotToPublicProfile(buildSnapshot({ visibility: { ksa: false } }));
    expect(profile.profile?.visibility).toEqual({
      bio: true,
      experience: true,
      education: true,
      ksa: false,
      expectations: true,
    });
  });
});
