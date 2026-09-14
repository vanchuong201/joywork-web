import { describe, expect, it } from "vitest";
import { classifyJobRouteSegment } from "./job-route";

describe("classifyJobRouteSegment", () => {
  it("nhận URL chi tiết việc làm dạng slug--cuid", () => {
    expect(classifyJobRouteSegment("marketing--cmsr40poq0008ml5l8dg4d5cy")).toBe("job-detail");
  });

  it("nhận URL cũ chỉ có cuid", () => {
    expect(classifyJobRouteSegment("cmsr40poq0008ml5l8dg4d5cy")).toBe("job-detail");
  });

  it("coi slug thuần là SEO landing", () => {
    expect(classifyJobRouteSegment("marketing")).toBe("seo-landing");
    expect(classifyJobRouteSegment("viec-lam-it-ha-noi")).toBe("seo-landing");
  });

  it("coi slug có -- nhưng phần id không phải cuid là SEO landing", () => {
    expect(classifyJobRouteSegment("marketing--khong-phai-cuid")).toBe("seo-landing");
  });
});
