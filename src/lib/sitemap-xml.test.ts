import { describe, expect, it } from "vitest";
import { renderSitemapIndex, renderUrlSet, STATIC_SITEMAP_PATHS } from "./sitemap-xml";

describe("sitemap xml", () => {
  it("escapes locations and keeps static paths free of private sections", () => {
    const xml = renderUrlSet([{ loc: "https://joywork.vn/jobs?q=<a>", lastmod: "2026-10-07T00:00:00.000Z" }]);
    expect(xml).toContain("https://joywork.vn/jobs?q=&lt;a&gt;");
    expect(STATIC_SITEMAP_PATHS.join(",")).not.toMatch(/candidates|login|tags|viec-lam/);
  });

  it("lists the four sitemap files", () => {
    const xml = renderSitemapIndex([
      "https://joywork.vn/sitemaps/static.xml",
      "https://joywork.vn/sitemaps/companies.xml",
      "https://joywork.vn/sitemaps/jobs.xml",
      "https://joywork.vn/sitemaps/job-categories.xml",
    ]);
    expect(xml.match(/<loc>/g)).toHaveLength(4);
  });
});
