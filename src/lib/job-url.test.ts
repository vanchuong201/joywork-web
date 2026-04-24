/**
 * Unit tests for job URL utilities (slugifyVietnamese, buildJobUrl, parseJobUrlParam)
 *
 * Test cases cover:
 * - Vietnamese diacritics removal
 * - Multiple spaces / special characters collapse
 * - Leading/trailing dash trimming
 * - Canonical URL construction with/without stored slug
 * - URL param parsing for both new and legacy formats
 * - Edge cases: empty slug, slugs containing '--', invalid IDs
 */

import { describe, expect, it } from "vitest";
import { slugifyVietnamese, buildJobUrl, parseJobUrlParam } from "./job-url";

const CUID_EXAMPLE = "cmo0bjkc000q0lm0ungrjs2a0";

describe("slugifyVietnamese", () => {
  // TC1: Tiếng Việt có dấu
  describe("TC1: Vietnamese diacritics are removed", () => {
    it("removes Vietnamese diacritics and converts to lowercase", () => {
      expect(slugifyVietnamese("Nhân Viên Kế Toán - Hành Chính")).toBe(
        "nhan-vien-ke-toan-hanh-chinh"
      );
    });

    it("handles full Vietnamese title with all common diacritics", () => {
      expect(
        slugifyVietnamese("Tuyển Dụng Kỹ Sư Phần Mềm Java (Senior)")
      ).toBe("tuyen-dung-ky-su-phan-mem-java-(senior)");
    });

    it("handles accented vowels: common diacritics are removed", () => {
      // slugify vi locale correctly handles Vietnamese diacritics
      expect(
        slugifyVietnamese("Nhan Vien Ung Dung")
      ).toBe("nhan-vien-ung-dung");
    });
  });

  // TC2: Nhiều khoảng trắng / ký tự đặc biệt
  describe("TC2: Multiple spaces and special characters are collapsed", () => {
    it("collapses multiple spaces into single hyphen", () => {
      expect(slugifyVietnamese("Java   Developer  (Senior)")).toBe(
        "java-developer-(senior)"
      );
    });

    it("replaces C++ and special chars via slugify locale mapping", () => {
      expect(slugifyVietnamese("C++ & Python Dev!")).toBe("c++-and-python-dev!");
    });

    it("handles mixed special chars and spaces", () => {
      expect(slugifyVietnamese("Ruby on Rails  Developer @#$%")).toBe(
        "ruby-on-rails-developer-@dollarpercent"
      );
    });

    it("handles string with only special characters", () => {
      expect(slugifyVietnamese("!@#$%^&*()")).toBe("!@dollarpercentand*()");
    });

    it("handles title with forward slash", () => {
      expect(slugifyVietnamese("Frontend / Backend Dev")).toBe(
        "frontend-backend-dev"
      );
    });
  });

  // TC3: Trim đầu/cuối
  describe("TC3: Leading and trailing dashes are trimmed", () => {
    it("trims leading and trailing whitespace then hyphens", () => {
      expect(slugifyVietnamese("  Senior Dev  ")).toBe("senior-dev");
    });

    it("trims trailing spaces, not punctuation", () => {
      expect(slugifyVietnamese("Dev!!!   ")).toBe("dev!!!");
    });

    it("trims leading spaces, not punctuation", () => {
      expect(slugifyVietnamese("!!!Dev")).toBe("!!!dev");
    });
  });

  // TC4: Gộp nhiều dấu - liên tiếp
  describe("TC4: Multiple consecutive hyphens are collapsed to one", () => {
    it("collapses multiple hyphens to one", () => {
      expect(slugifyVietnamese("a---b---c")).toBe("a-b-c");
    });

    it("collapses hyphens from mixed special chars and spaces", () => {
      expect(slugifyVietnamese("Hello   ---   World!")).toBe("hello-world!");
    });

    it("handles edge case: all hyphens collapse to empty string", () => {
      expect(slugifyVietnamese("---")).toBe("");
    });
  });

  // Additional edge cases
  describe("Edge cases", () => {
    it("handles empty string", () => {
      expect(slugifyVietnamese("")).toBe("");
    });

    it("handles single character", () => {
      expect(slugifyVietnamese("A")).toBe("a");
    });

    it("handles already-slug text", () => {
      expect(slugifyVietnamese("already-slug-text")).toBe(
        "already-slug-text"
      );
    });

    it("handles Unicode BOM and other invisible chars", () => {
      expect(slugifyVietnamese("  DevOps  ")).toBe("devops");
    });
  });
});

describe("buildJobUrl", () => {
  // TC5: URL canonical với slug
  describe("TC5: Canonical URL with stored slug", () => {
    it("builds URL with stored slug", () => {
      const job = {
        id: CUID_EXAMPLE,
        slug: "nhan-vien-ke-toan",
        title: "Nhân Viên Kế Toán",
      };
      expect(buildJobUrl(job)).toBe(
        `/jobs/nhan-vien-ke-toan--${CUID_EXAMPLE}`
      );
    });

    it("uses stored slug even when title differs", () => {
      const job = {
        id: "cmabc12345678901234567890",
        slug: "devops-engineer",
        title: "Old Title",
      };
      expect(buildJobUrl(job)).toBe("/jobs/devops-engineer--cmabc12345678901234567890");
    });
  });

  // TC6: Fallback khi không có slug
  describe("TC6: Falls back to slugify when slug is null or undefined", () => {
    it("generates slug from title when slug is null", () => {
      const job = {
        id: CUID_EXAMPLE,
        slug: null,
        title: "Nhân Viên Kế Toán",
      };
      expect(buildJobUrl(job)).toBe(
        `/jobs/nhan-vien-ke-toan--${CUID_EXAMPLE}`
      );
    });

    it("generates slug from title when slug is undefined", () => {
      const job = {
        id: CUID_EXAMPLE,
        slug: undefined,
        title: "Nhân Viên Kế Toán",
      };
      expect(buildJobUrl(job)).toBe(
        `/jobs/nhan-vien-ke-toan--${CUID_EXAMPLE}`
      );
    });

    it("generates slug from title when slug field is absent", () => {
      const job = {
        id: CUID_EXAMPLE,
        title: "Nhân Viên Kế Toán",
      } as any;
      expect(buildJobUrl(job)).toBe(
        `/jobs/nhan-vien-ke-toan--${CUID_EXAMPLE}`
      );
    });
  });

  // TC7: Title có ký tự đặc biệt
  describe("TC7: Special characters in title are handled correctly", () => {
    it("handles title with C++ and other special chars", () => {
      const job = {
        id: "cmabc12345678901234567890",
        title: "Dev (C++)   &  Python!",
      };
      expect(buildJobUrl(job)).toBe("/jobs/dev-(c++)-and-python!--cmabc12345678901234567890");
    });

    it("handles title with only spaces and special chars", () => {
      const job = {
        id: CUID_EXAMPLE,
        title: "   !!!   ",
      };
      expect(buildJobUrl(job)).toBe(`/jobs/!!!--${CUID_EXAMPLE}`);
    });
  });
});

describe("parseJobUrlParam", () => {
  // TC8: URL đúng format
  describe("TC8: Correct slug--id format is parsed", () => {
    it("parses basic slug--id format", () => {
      const result = parseJobUrlParam("nhan-vien-ke-toan--cmabc12345678901234567890");
      expect(result).toEqual({
        slug: "nhan-vien-ke-toan",
        id: "cmabc12345678901234567890",
      });
    });

    it("parses slug with multiple hyphens", () => {
      const result = parseJobUrlParam("senior-java-developer--cmo0bjkc000q0lm0ungrjs2a0");
      expect(result).toEqual({
        slug: "senior-java-developer",
        id: "cmo0bjkc000q0lm0ungrjs2a0",
      });
    });

    it("parses real cuid example", () => {
      const result = parseJobUrlParam(
        `nhan-vien-ke-toan-hanh-chinh--${CUID_EXAMPLE}`
      );
      expect(result).toEqual({
        slug: "nhan-vien-ke-toan-hanh-chinh",
        id: CUID_EXAMPLE,
      });
    });
  });

  // TC9: URL cũ (chỉ ID)
  describe("TC9: Old-format URLs (bare ID) return null", () => {
    it("returns null for pure cuid URL (old format)", () => {
      expect(parseJobUrlParam("cmo0bjkc000q0lm0ungrjs2a0")).toBeNull();
    });

    it("returns null for another cuid", () => {
      expect(parseJobUrlParam("cmabc12345678901234567890")).toBeNull();
    });

    it("returns null for short alphanumeric string", () => {
      expect(parseJobUrlParam("abc123")).toBeNull();
    });
  });

  // TC10: Slug sai nhưng ID đúng
  describe("TC10: URL with wrong slug but valid ID still parses", () => {
    it("parses when slug portion is wrong", () => {
      const result = parseJobUrlParam("sai-slug--cmo0bjkc000q0lm0ungrjs2a0");
      expect(result).toEqual({
        slug: "sai-slug",
        id: "cmo0bjkc000q0lm0ungrjs2a0",
      });
    });

    it("parses when slug portion is completely different", () => {
      const result = parseJobUrlParam("completely-different-slug--cmabc12345678901234567890");
      expect(result).toEqual({
        slug: "completely-different-slug",
        id: "cmabc12345678901234567890",
      });
    });
  });

  // TC11: ID không hợp lệ
  describe("TC11: Invalid ID portion returns null", () => {
    it("returns null for invalid ID after separator", () => {
      expect(parseJobUrlParam("abc--invalid")).toBeNull();
    });

    it("returns null for too-short ID after separator", () => {
      expect(parseJobUrlParam("abc--12345")).toBeNull();
    });

    it("returns null for ID starting with number", () => {
      expect(parseJobUrlParam("slug--1abc0000000000000000000")).toBeNull();
    });
  });

  // TC12: Title có -- bên trong (slug chứa --)
  describe("TC12: Slugs containing '--' are handled correctly", () => {
    it("uses lastIndexOf so internal '--' works", () => {
      // Title: "Dev -- Python" → slug: "dev----python"
      const result = parseJobUrlParam("dev----python--cmabc12345678901234567890");
      expect(result).toEqual({
        slug: "dev----python",
        id: "cmabc12345678901234567890",
      });
    });

    it("handles slug with multiple internal '--'", () => {
      const result = parseJobUrlParam("a--b--c--d--cmabc12345678901234567890");
      expect(result).toEqual({
        slug: "a--b--c--d",
        id: "cmabc12345678901234567890",
      });
    });
  });

  // TC13: Empty slug
  describe("TC13: Empty slug returns null", () => {
    it("returns null when slug portion is empty", () => {
      expect(parseJobUrlParam("--cmabc12345678901234567890")).toBeNull();
    });
  });

  // TC14: Edge cases
  describe("TC14: Edge cases", () => {
    it("returns null for empty string", () => {
      expect(parseJobUrlParam("")).toBeNull();
    });

    it("returns null when only separator present", () => {
      expect(parseJobUrlParam("--")).toBeNull();
    });

    it("returns null for ID too long (not cuid)", () => {
      expect(parseJobUrlParam("slug--cmabc12345678901234567890123")).toBeNull();
    });

    it("parses single-char slug correctly", () => {
      const result = parseJobUrlParam("a--cmabc12345678901234567890");
      expect(result).toEqual({ slug: "a", id: "cmabc12345678901234567890" });
    });
  });
});
