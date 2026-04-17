/**
 * URL Auto-Linking Utility
 *
 * Parses plain text and extracts URLs, returning an array of text segments
 * that can be safely rendered as React nodes.
 *
 * Security decisions:
 * - Only allows http/https protocols
 * - Prepends https:// to bare www. links
 * - Returns raw text segments, not HTML — rendering is done by the component
 *
 * Supports:
 * - https://domain.com, http://domain.com, www.domain.com
 * - URLs with query strings, paths, port numbers
 * - Multiple URLs in one string
 * - Balanced parentheses handling
 */

export type TextPart =
  | { type: "text"; value: string }
  | { type: "url"; href: string; display: string };

const ALLOWED_PROTOCOLS = ["http:", "https:"] as const;

/**
 * Permissive regex that matches URL-like strings.
 * Validation via URL constructor happens post-match.
 * Does NOT match whitespace, brackets, braces, or backtick.
 */
const URL_REGEX =
  /(?:https?:\/\/|www\.)[^\s<>[\]{}|\\^`"]+/gi;

/**
 * Characters that indicate a URL boundary (not part of URL).
 * We stop the URL here. Note: slash (/) is valid in URLs.
 * Single-quote is valid in URL paths. Parentheses are valid.
 */
const URL_STOP_CHARS = /[\s<>[\]{}|\\^`"]/;

/**
 * Characters that look like sentence-ending punctuation.
 * These are stripped from the END of a URL display if they would be
 * the last character (e.g. "https://a.com." → display "https://a.com").
 */
const TRAILING_PUNCT_REGEX = /[.,;:!?]+$/;

/**
 * Special hostnames that are valid even without a dot (e.g. localhost).
 */
const KNOWN_VALID_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

/**
 * Validates a URL string. For URLs without protocol (www.),
 * validates with https:// prepended.
 */
function isAllowedProtocol(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.includes(
      parsed.protocol as (typeof ALLOWED_PROTOCOLS)[number]
    );
  } catch {
    return false;
  }
}

function isValidUrl(url: string): boolean {
  if (!isAllowedProtocol(url)) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    if (!host || host.length === 0) return false;
    if (host.includes(".") || KNOWN_VALID_HOSTNAMES.has(host.toLowerCase())) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Converts a bare "www." URL to a full https:// URL.
 */
function normalizeUrl(url: string): string {
  if (url.startsWith("www.") || url.startsWith("WWW.")) {
    return `https://${url}`;
  }
  return url;
}

/**
 * Extracts URLs from a text string and returns an array of text/URL parts.
 *
 * Algorithm:
 * 1. Scan for URL-like patterns with regex
 * 2. Handle balanced parentheses wrapping "(https://a.com)"
 * 3. Validate via URL constructor with protocol check
 * 4. Preserve all text including punctuation
 *
 * Security: All URLs are validated via URL constructor with protocol check.
 * Dangerous protocols (javascript:, data:, etc.) are rejected.
 *
 * @param text - Input text that may contain URLs
 * @returns Array of text and URL segments
 *
 * @example
 * linkify("Visit https://joywork.vn")
 * // → [
 * //   { type: "text", value: "Visit " },
 * //   { type: "url", href: "https://joywork.vn", display: "https://joywork.vn" }
 * // ]
 */
export function linkify(text: string): TextPart[] {
  if (!text || typeof text !== "string") {
    return [];
  }

  const result: TextPart[] = [];
  let lastIndex = 0;

  URL_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = URL_REGEX.exec(text)) !== null) {
    const rawMatch = match[0];
    const matchStart = match.index;
    const matchEnd = matchStart + rawMatch.length;

    let urlCandidate = rawMatch;
    let actualEnd = matchEnd;

    // --- Balanced parentheses handling ---
    // Check for balanced outer parens in the ORIGINAL text: "(https://a.com)"
    // The regex may match starting after the "(", so check surrounding characters
    const charBeforeUrl = matchStart > 0 ? text[matchStart - 1] : undefined;
    const charAtMatchEnd = text[matchEnd]; // undefined if URL is at end of string
    const charBeforeEnd = text[matchEnd - 1]; // last char of rawMatch

    if (
      charBeforeUrl === "(" &&
      (charAtMatchEnd === ")" ||
        (matchEnd >= text.length && charBeforeEnd === ")"))
    ) {
      // URL is wrapped in balanced parens — strip outer parens
      urlCandidate = rawMatch;
      if (urlCandidate.endsWith(")")) {
        urlCandidate = urlCandidate.slice(0, -1);
      }
      // Skip past both opening and closing parens
      actualEnd = matchEnd + 1;
      if (actualEnd > text.length) actualEnd = text.length;
    } else if (urlCandidate.endsWith(")") && charBeforeUrl !== "(") {
      // Trailing ) is NOT a balanced opening paren — likely sentence punctuation
      // Strip it from the URL
      urlCandidate = urlCandidate.slice(0, -1);
    }

    // --- Normalize (prepend https:// for www.) and validate ---
    const normalized = normalizeUrl(urlCandidate);
    if (!isValidUrl(normalized)) {
      // Not a valid URL — skip
      continue;
    }

    // --- Clean display text: strip trailing punctuation for better UX ---
    // The href should be clean, but display can also be cleaned
    let displayUrl = urlCandidate;
    const punctStripped = urlCandidate.replace(TRAILING_PUNCT_REGEX, "");
    if (
      punctStripped.length > 0 &&
      punctStripped.length < urlCandidate.length &&
      isValidUrl(normalizeUrl(punctStripped))
    ) {
      displayUrl = punctStripped;
    }

    // --- Add text before this match ---
    if (matchStart > lastIndex) {
      result.push({ type: "text", value: text.slice(lastIndex, matchStart) });
    }

    // --- Add URL segment ---
    result.push({
      type: "url",
      href: normalized,
      display: displayUrl,
    });

    lastIndex = actualEnd;
  }

  // --- Add remaining text after last match ---
  if (lastIndex < text.length) {
    result.push({ type: "text", value: text.slice(lastIndex) });
  }

  return result;
}

/**
 * Checks if a string contains any URL.
 */
export function containsUrl(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  URL_REGEX.lastIndex = 0;
  return URL_REGEX.test(text);
}
