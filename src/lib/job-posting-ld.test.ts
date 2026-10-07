import { describe, expect, it } from "vitest";
import { buildJobPostingLd, isJobClosed } from "./job-posting-ld";

const openJob = {
  id: "clxxxxxxxxxxxxxxxxxxxxxxx",
  title: "Nhân viên marketing",
  slug: "nhan-vien-marketing",
  createdAt: "2026-10-01T00:00:00.000Z",
  isActive: true,
  applicationDeadline: "2026-12-01T00:00:00.000Z",
  location: "Hà Nội",
  remote: false,
  employmentType: "FULL_TIME",
  company: { name: "Acme", slug: "acme", website: "https://acme.vn" },
};

describe("buildJobPostingLd", () => {
  it("bỏ baseSalary khi lương thỏa thuận", () => {
    const data = buildJobPostingLd(openJob, "https://joywork.vn", new Date("2026-10-07T00:00:00.000Z"));
    expect(data).not.toHaveProperty("baseSalary");
    expect(data?.jobLocation).toBeTruthy();
    expect(data?.hiringOrganization).toMatchObject({ sameAs: "https://acme.vn" });
  });

  it("remote không có jobLocation", () => {
    const data = buildJobPostingLd(
      { ...openJob, remote: true, salaryMin: 10_000_000, salaryMax: 15_000_000, currency: "VND" },
      "https://joywork.vn",
      new Date("2026-10-07T00:00:00.000Z"),
    );
    expect(data).not.toHaveProperty("jobLocation");
    expect(data?.jobLocationType).toBe("TELECOMMUTE");
    expect(data?.baseSalary).toMatchObject({ "@type": "MonetaryAmount" });
  });

  it("tin đóng không có JobPosting", () => {
    const now = new Date("2026-10-07T00:00:00.000Z");
    expect(buildJobPostingLd({ ...openJob, isActive: false }, "https://joywork.vn", now)).toBeNull();
    expect(isJobClosed({ isActive: true, applicationDeadline: "2026-10-01T00:00:00.000Z" }, now)).toBe(true);
  });
});
