import { describe, expect, it } from "vitest";
import { buildCompanyProfileTitle, buildJobDetailTitle, truncateSeoName } from "./seo-title";

describe("truncateSeoName", () => {
  it("giữ nguyên tên không quá 50 ký tự", () => {
    expect(truncateSeoName("Nhân viên kinh doanh")).toBe("Nhân viên kinh doanh");
  });

  it("cắt tên dài và thêm bốn dấu chấm, tổng không quá 50 ký tự", () => {
    const longName = "Nhân viên kinh doanh bất động sản khu vực trung tâm thành phố";
    const result = truncateSeoName(longName);
    expect(result.endsWith("....")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(50);
    expect(result.length).toBeGreaterThan(40);
  });
});

describe("buildJobDetailTitle", () => {
  it("gắn tỉnh khi job có tỉnh/thành", () => {
    expect(
      buildJobDetailTitle({
        jobTitle: "Nhân viên kinh doanh",
        companyName: "Công ty TNHH Mắt sáng",
        province: "Hà Nội",
      }),
    ).toBe("Nhân viên kinh doanh tại Công ty TNHH Mắt sáng ở Hà Nội | JOYWORK");
  });

  it("bỏ cụm ở tỉnh khi job không có tỉnh/thành", () => {
    expect(
      buildJobDetailTitle({
        jobTitle: "Nhân viên kinh doanh",
        companyName: "Công ty TNHH Mắt sáng",
        province: "  ",
      }),
    ).toBe("Nhân viên kinh doanh tại Công ty TNHH Mắt sáng | JOYWORK");
  });

  it("rút cả tên vị trí và tên công ty khi mỗi cái dài quá 50 ký tự", () => {
    const title = buildJobDetailTitle({
      jobTitle: "Nhân viên kinh doanh bất động sản khu vực trung tâm thành phố",
      companyName: "Công ty TNHH Mắt sáng và phát triển giáo dục kỹ năng nghề",
      province: "Hà Nội",
    });

    expect(title).toContain(".... tại ");
    expect(title).toContain(".... ở Hà Nội | JOYWORK");
    expect(title.startsWith("Nhân viên kinh doanh")).toBe(true);
  });
});

describe("buildCompanyProfileTitle", () => {
  it("rút tên công ty dài trong title hồ sơ", () => {
    const title = buildCompanyProfileTitle(
      "Công ty TNHH Mắt sáng và phát triển giáo dục kỹ năng nghề",
    );
    expect(title.endsWith(" - Văn Hóa Doanh Nghiệp & Tuyển Dụng | JOYWORK")).toBe(true);
    expect(title.startsWith("Công ty TNHH Mắt sáng")).toBe(true);
    expect(title).toContain(".... - Văn Hóa");
  });
});
