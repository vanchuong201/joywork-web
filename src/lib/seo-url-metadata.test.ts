import { describe, expect, it } from "vitest";
import { buildSeoLandingMetadata, jobsListCanonicalUrl } from "./seo-url-metadata";

const SITE = "https://joywork.vn";

describe("buildSeoLandingMetadata", () => {
  it("dùng title/description do admin nhập và canonical theo slug", () => {
    const meta = buildSeoLandingMetadata(
      {
        slug: "marketing",
        title: "Việc Làm Marketing Mới Nhất | JOYWORK",
        description: "Cập nhật tin tuyển dụng Marketing mới nhất.",
        hasResults: true,
      },
      SITE,
    );

    expect(meta.title).toBe("Việc Làm Marketing Mới Nhất | JOYWORK");
    expect(meta.alternates?.canonical).toBe(`${SITE}/jobs/marketing`);
    expect(meta.robots).toEqual({ index: true, follow: true });
    expect(meta.openGraph?.url).toBe(`${SITE}/jobs/marketing`);
  });

  it("trỏ canonical về URL chính khi landing là alias cùng bộ lọc", () => {
    const meta = buildSeoLandingMetadata(
      {
        slug: "tuyen-dung-marketing",
        title: "Tuyển Dụng Marketing | JOYWORK",
        description: "Alias của trang việc làm Marketing.",
        hasResults: true,
        canonicalPath: "/jobs/viec-lam-marketing",
      },
      SITE,
    );

    expect(meta.alternates?.canonical).toBe(`${SITE}/jobs/viec-lam-marketing`);
    expect(meta.openGraph?.url).toBe(`${SITE}/jobs/viec-lam-marketing`);
    expect(meta.robots).toEqual({ index: true, follow: true });
  });

  it("noindex nhưng vẫn follow khi landing chưa có kết quả", () => {
    const meta = buildSeoLandingMetadata(
      { slug: "marketing", title: "T", description: "D", hasResults: false },
      SITE,
    );

    expect(meta.robots).toEqual({ index: false, follow: true });
  });
});

describe("jobsListCanonicalUrl", () => {
  it("trả canonical cố định cho trang danh sách", () => {
    expect(jobsListCanonicalUrl(SITE)).toBe(`${SITE}/jobs`);
  });
});
