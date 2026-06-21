/**
 * Chuyển HTML JD (vd. mission) thành mô tả thuần text cho Open Graph / Twitter.
 * Chạy được trên server; không dùng DOM.
 */
export function htmlToOgDescription(
  html: string | null | undefined,
  maxLen = 200,
): string {
  if (!html || !html.trim()) {
    return "";
  }
  const plain = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n: string) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    })
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLen) {
    return plain;
  }
  return `${plain.slice(0, maxLen - 1).trimEnd()}…`;
}
