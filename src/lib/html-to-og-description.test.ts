import { describe, expect, it } from "vitest";
import { htmlToOgDescription } from "./html-to-og-description";

describe("htmlToOgDescription", () => {
  it("strips tags and normalizes whitespace", () => {
    expect(htmlToOgDescription("<p>Hello  <strong>world</strong></p>")).toBe("Hello world");
  });

  it("truncates with ellipsis", () => {
    const long = "a".repeat(250);
    expect(htmlToOgDescription(`<p>${long}</p>`, 200).endsWith("…")).toBe(true);
    expect(htmlToOgDescription(`<p>${long}</p>`, 200).length).toBeLessThanOrEqual(200);
  });

  it("returns empty for nullish", () => {
    expect(htmlToOgDescription(null)).toBe("");
    expect(htmlToOgDescription(undefined)).toBe("");
  });
});
