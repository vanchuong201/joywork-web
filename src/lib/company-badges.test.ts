import { describe, expect, it } from "vitest";

import { normalizeCompanyBadges } from "@/lib/company-badges";

describe("normalizeCompanyBadges", () => {
  it("trả về mảng rỗng khi đầu vào không hợp lệ", () => {
    expect(normalizeCompanyBadges(undefined)).toEqual([]);
    expect(normalizeCompanyBadges(null)).toEqual([]);
    expect(normalizeCompanyBadges([])).toEqual([]);
  });

  it("giữ đúng badge đơn", () => {
    expect(normalizeCompanyBadges(["GOOD_COMPANY"])).toEqual(["GOOD_COMPANY"]);
    expect(normalizeCompanyBadges(["BASIC_COMMITMENT"])).toEqual(["BASIC_COMMITMENT"]);
  });

  it("lọc giá trị lạ và chuẩn hóa thứ tự hiển thị khi có 2 badge", () => {
    expect(
      normalizeCompanyBadges([
        "UNKNOWN_BADGE",
        "BASIC_COMMITMENT",
        "GOOD_COMPANY",
        "GOOD_COMPANY",
      ])
    ).toEqual(["GOOD_COMPANY", "BASIC_COMMITMENT"]);
  });
});
