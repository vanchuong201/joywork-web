import type { MetadataRoute } from "next";

/**
 * robots.txt cho preview link (Facebook, LinkedIn, Zalo, …).
 * Khối user-agent cho các crawler phổ biến giúp tuân khuyến nghị của Meta.
 *
 * Nếu Facebook Sharing Debugger vẫn báo HTTP 403: thường do Cloudflare / WAF
 * (Bot Fight Mode, Super Bot Fight, rule theo IP). Cần bật "Verified Bots"
 * hoặc rule Allow cho User-Agent chứa `facebookexternalhit` / `Facebot`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "facebookexternalhit", allow: ["/"] },
      { userAgent: "Facebot", allow: ["/"] },
      { userAgent: "LinkedInBot", allow: ["/"] },
      { userAgent: "Twitterbot", allow: ["/"] },
      { userAgent: "Slackbot", allow: ["/"] },
      { userAgent: "Discordbot", allow: ["/"] },
      { userAgent: "TelegramBot", allow: ["/"] },
      { userAgent: "Googlebot", allow: ["/"] },
      { userAgent: "Applebot", allow: ["/"] },
      { userAgent: "*", allow: ["/"] },
    ],
  };
}
