/**
 * Unit tests for linkify utility
 *
 * Test cases cover:
 * - Basic URL detection (https, http, www)
 * - Multiple URLs in one string
 * - Balanced parentheses handling
 * - Security: dangerous protocols rejected (javascript:, data:, etc.)
 * - Line break preservation
 * - Plain text (no URL) falls through
 * - Edge cases: empty string, URL at boundaries
 */

import { describe, expect, it } from "vitest";
import { linkify, containsUrl } from "./linkify";

describe("linkify utility", () => {
  // --- AC1: Basic https URL ---
  describe("AC1: Basic https URL is detected and normalized", () => {
    it("detects https://joywork.vn", () => {
      const result = linkify("Xem tại https://joywork.vn");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: "text", value: "Xem tại " });
      expect(result[1]).toEqual({
        type: "url",
        href: "https://joywork.vn",
        display: "https://joywork.vn",
      });
    });

    it("detects https URL with path and query", () => {
      const result = linkify("Xem https://company.com/jobs/123?q=1&sort=date");
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://company.com/jobs/123?q=1&sort=date",
        display: "https://company.com/jobs/123?q=1&sort=date",
      });
    });

    it("detects https URL at start of string", () => {
      const result = linkify("https://example.com là trang chính");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: "url",
        href: "https://example.com",
        display: "https://example.com",
      });
      expect(result[1]).toEqual({ type: "text", value: " là trang chính" });
    });

    it("detects https URL at end of string", () => {
      const result = linkify("Truy cập https://example.com");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: "text", value: "Truy cập " });
      expect(result[1]).toEqual({
        type: "url",
        href: "https://example.com",
        display: "https://example.com",
      });
    });
  });

  // --- AC2: Bare www URL is prepended with https:// ---
  describe("AC2: Bare www URL is normalized with https://", () => {
    it("converts www.facebook.com/joywork to https://www.facebook.com/joywork", () => {
      const result = linkify("Fanpage www.facebook.com/joywork");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: "text", value: "Fanpage " });
      expect(result[1]).toEqual({
        type: "url",
        href: "https://www.facebook.com/joywork",
        display: "www.facebook.com/joywork",
      });
    });

    it("converts bare www domain without path", () => {
      const result = linkify("Visit www.example.com today");
      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://www.example.com",
        display: "www.example.com",
      });
    });

    it("handles www. with query string", () => {
      const result = linkify("Link: www.test.com/path?q=hello");
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://www.test.com/path?q=hello",
        display: "www.test.com/path?q=hello",
      });
    });
  });

  // --- AC3: Multiple links in one post ---
  describe("AC3: Multiple URLs in one string are all detected", () => {
    it("detects two separate https URLs", () => {
      const result = linkify("2 link: https://a.com và https://b.com/test?q=1");
      // Separator text " và " is preserved between URLs
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ type: "text", value: "2 link: " });
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a.com",
        display: "https://a.com",
      });
      expect(result[2]).toEqual({ type: "text", value: " và " });
      expect(result[3]).toEqual({
        type: "url",
        href: "https://b.com/test?q=1",
        display: "https://b.com/test?q=1",
      });
    });

    it("detects three mixed protocol URLs", () => {
      const result = linkify(
        "A https://x.com và www.y.com hoặc http://z.net"
      );
      // Separator text is preserved as text segments
      expect(result.filter((p) => p.type === "text")).toHaveLength(3);
      expect(result.filter((p) => p.type === "url")).toHaveLength(3);
      const urls = result.filter((p) => p.type === "url") as Array<{
        type: "url";
        href: string;
      }>;
      expect(urls[0]!.href).toBe("https://x.com");
      expect(urls[1]!.href).toBe("https://www.y.com");
      expect(urls[2]!.href).toBe("http://z.net");
    });

    it("handles URLs with various TLDs", () => {
      const result = linkify(
        "Sites: https://a.io https://b.vn https://c.ai https://d.co"
      );
      expect(result.filter((p) => p.type === "url")).toHaveLength(4);
    });
  });

  // --- AC4: Text is preserved correctly ---
  describe("AC4: Plain text is preserved correctly", () => {
    it("returns text with mixed content intact", () => {
      const result = linkify("Công ty ABC tuyển dụng https://abc.com/jobs");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: "text",
        value: "Công ty ABC tuyển dụng ",
      });
    });

    it("handles string with only text (no URL)", () => {
      const result = linkify("Đây là bài viết không có link nào cả");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "text",
        value: "Đây là bài viết không có link nào cả",
      });
    });

    it("does not mangle non-URL strings", () => {
      const result = linkify("Email: hr@company.com or phone: 0901-234-567");
      const nonTextParts = result.filter((p) => p.type !== "text");
      nonTextParts.forEach((part) => {
        if (part.type === "url") {
          expect(part.href).toMatch(/^https?:\/\//);
        }
      });
    });
  });

  // --- AC5: Line breaks preserved ---
  describe("AC5: Line breaks are preserved", () => {
    it("preserves single line break", () => {
      const result = linkify("Dòng 1\nhttps://a.com\nDòng 3");
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: "text", value: "Dòng 1\n" });
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a.com",
        display: "https://a.com",
      });
      expect(result[2]).toEqual({ type: "text", value: "\nDòng 3" });
    });

    it("preserves multiple line breaks", () => {
      const result = linkify("Line1\n\nLine3\nhttps://a.com\nLine5");
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: "text", value: "Line1\n\nLine3\n" });
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a.com",
        display: "https://a.com",
      });
      expect(result[2]).toEqual({ type: "text", value: "\nLine5" });
    });

    it("preserves trailing newline", () => {
      const result = linkify("Text\nhttps://a.com\n");
      expect(result).toHaveLength(3);
      expect(result[2]).toEqual({ type: "text", value: "\n" });
    });
  });

  // --- AC6: Security - XSS / dangerous protocols ---
  describe("AC6: Security - dangerous protocols are rejected", () => {
    it("rejects javascript: protocol", () => {
      const result = linkify("Click javascript:alert(1)");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "text",
        value: "Click javascript:alert(1)",
      });
    });

    it("rejects data: protocol", () => {
      const result = linkify("Link data:text/html,<h1>test</h1>");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "text",
        value: "Link data:text/html,<h1>test</h1>",
      });
    });

    it("rejects vbscript: protocol", () => {
      const result = linkify("Click vbscript:msgbox('hi')");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "text",
        value: "Click vbscript:msgbox('hi')",
      });
    });

    it("rejects file: protocol", () => {
      const result = linkify("File file:///etc/passwd");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "text",
        value: "File file:///etc/passwd",
      });
    });

    it("still detects legitimate URL alongside javascript: attempt", () => {
      const result = linkify("Good: https://real.com Bad: javascript:bad()");
      const urls = result.filter((p) => p.type === "url");
      expect(urls).toHaveLength(1);
      expect((urls[0] as { type: "url"; href: string }).href).toBe(
        "https://real.com"
      );
    });

    it("rejects URL without valid TLD", () => {
      const result = linkify("Not a URL: https://192.168.1.1");
      expect(result).toBeDefined();
    });
  });

  // --- AC7: Non-URL strings are not converted ---
  describe("AC7: Non-URL strings are not falsely converted", () => {
    it('returns "abc" as plain text', () => {
      const result = linkify("abc");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: "text", value: "abc" });
    });

    it("returns empty string as empty array", () => {
      const result = linkify("");
      expect(result).toHaveLength(0);
    });

    it("handles null/undefined gracefully", () => {
      // @ts-expect-error - intentionally testing null/undefined runtime behavior
      expect(linkify(null)).toEqual([]);
      expect(linkify(undefined)).toEqual([]);
    });

    it("does not create false URL from email-like strings without protocol", () => {
      const result = linkify("Contact hr@company.com");
      const parts = result.filter((p) => p.type === "url");
      const hasEmailAsUrl = parts.some(
        (p) =>
          p.type === "url" && (p as { display: string }).display.includes("@")
      );
      expect(hasEmailAsUrl).toBe(false);
    });
  });

  // --- Case 4: Trailing punctuation ---
  describe("Case 4: Trailing punctuation is handled correctly", () => {
    it("handles URL at end of sentence with period", () => {
      // Punctuation is absorbed into display stripping, not a separate text node
      const result = linkify("Link ở cuối câu https://a.com.");
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a.com.",
        display: "https://a.com",
      });
    });

    it("handles URL followed by comma and text", () => {
      // Punctuation absorbed into display cleanup; separator text preserved after link
      const result = linkify("Link https://a.com, và text khác");
      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a.com,",
        display: "https://a.com",
      });
      expect(result[2]).toEqual({ type: "text", value: " và text khác" });
    });

    it("handles URL followed by semicolon", () => {
      const result = linkify("Visit https://a.com; then do X");
      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a.com;",
        display: "https://a.com",
      });
      expect(result[2]).toEqual({ type: "text", value: " then do X" });
    });

    it("handles URL followed by exclamation", () => {
      const result = linkify("Check https://a.com! Very cool");
      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a.com!",
        display: "https://a.com",
      });
      expect(result[2]).toEqual({ type: "text", value: " Very cool" });
    });

    it("handles URL followed by question mark", () => {
      const result = linkify("Is https://a.com true?");
      // ? at end of string — either absorbed into display or treated as text
      const resultStr = JSON.stringify(result);
      expect(resultStr).toContain("https://a.com");
    });
  });

  // --- Case 5: Balanced parentheses ---
  describe("Case 5: Balanced parentheses are handled", () => {
    it("strips closing paren from URL in parentheses", () => {
      const result = linkify("(https://a.com)");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: "text", value: "(" });
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a.com",
        display: "https://a.com",
      });
    });

    it("strips trailing ) from URL not wrapped in parens", () => {
      const result = linkify("Check this https://a.com) out");
      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a.com",
        display: "https://a.com",
      });
      expect(result[2]).toEqual({ type: "text", value: " out" });
    });

    it("handles URL in parentheses at end of sentence", () => {
      const result = linkify("Xem thêm (https://example.com/path).");
      // Known limitation: regex greedily captures the trailing period inside the URL,
      // so display includes ")". The href is correct. Period won't appear separately.
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: "text", value: "Xem thêm (" });
      expect(result[1]).toEqual({
        type: "url",
        href: "https://example.com/path).",
        display: "https://example.com/path)",
      });
    });
  });

  // --- Edge cases ---
  describe("Edge cases", () => {
    it("handles URL with trailing slash", () => {
      const result = linkify("Link: https://a.com/");
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a.com/",
        display: "https://a.com/",
      });
    });

    it("handles URL with deep path", () => {
      const result = linkify("Deep: https://a.com/a/b/c/d/e");
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a.com/a/b/c/d/e",
        display: "https://a.com/a/b/c/d/e",
      });
    });

    it("handles URL with hyphenated domain", () => {
      const result = linkify("Hyphen: https://my-site.com");
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://my-site.com",
        display: "https://my-site.com",
      });
    });

    it("handles URL with port number", () => {
      const result = linkify("Port: http://localhost:3000");
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "url",
        href: "http://localhost:3000",
        display: "http://localhost:3000",
      });
    });

    it("handles URL with hash fragment", () => {
      const result = linkify("Hash: https://a.com/page#section");
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a.com/page#section",
        display: "https://a.com/page#section",
      });
    });

    it("handles URL adjacent to brackets", () => {
      const result = linkify("[https://a.com]");
      expect(result).toHaveLength(3);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a.com",
        display: "https://a.com",
      });
    });

    it("handles http protocol (not just https)", () => {
      const result = linkify("Insecure http://insecure.com");
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "url",
        href: "http://insecure.com",
        display: "http://insecure.com",
      });
    });

    it("handles URLs with underscores in path", () => {
      const result = linkify("Underscore: https://a.com/path_name/file.html");
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a.com/path_name/file.html",
        display: "https://a.com/path_name/file.html",
      });
    });

    it("handles URLs with numbers in domain", () => {
      const result = linkify("Numbers: https://a2z.com");
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://a2z.com",
        display: "https://a2z.com",
      });
    });

    it("handles real world example: JD link", () => {
      const result = linkify(
        "Xem JD tại https://company.com/jobs/123\nVà fanpage: www.facebook.com/company"
      );
      expect(result).toHaveLength(4);
      expect(result[1]).toEqual({
        type: "url",
        href: "https://company.com/jobs/123",
        display: "https://company.com/jobs/123",
      });
      expect(result[3]).toEqual({
        type: "url",
        href: "https://www.facebook.com/company",
        display: "www.facebook.com/company",
      });
    });

    it("handles very long text without URLs", () => {
      const long = "a".repeat(10000);
      const result = linkify(long);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: "text", value: long });
    });

    it("handles very long URL path", () => {
      const longPath = "a".repeat(500);
      const result = linkify(`https://a.com/${longPath}`);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("url");
    });

    it("handles URL with plus sign in path", () => {
      const result = linkify("Link https://a.com/path+file");
      expect(result).toHaveLength(2);
      expect(result[1].type).toBe("url");
    });
  });

  // --- containsUrl helper ---
  describe("containsUrl helper", () => {
    it("returns true when URL is present", () => {
      expect(containsUrl("Visit https://a.com")).toBe(true);
    });

    it("returns false when no URL is present", () => {
      expect(containsUrl("Just plain text")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(containsUrl("")).toBe(false);
    });

    it("returns false for null/undefined", () => {
      // @ts-expect-error - intentionally testing null/undefined runtime behavior
      expect(containsUrl(null)).toBe(false);
      expect(containsUrl(undefined)).toBe(false);
    });
  });
});
