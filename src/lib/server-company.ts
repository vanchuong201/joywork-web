import { permanentRedirect } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
const API_BASE_CANDIDATES = Array.from(
  new Set(
    [
      process.env.INTERNAL_API_BASE_URL,
      API_BASE_URL,
      "http://localhost:4000",
      "http://127.0.0.1:4000",
    ].filter(Boolean),
  ),
) as string[];

export async function fetchCompanyBySlug(slug: string, cookie?: string) {
  let sawNotFound = false;
  let lastError: unknown = null;

  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      const res = await fetch(`${baseUrl}/api/companies/${encodeURIComponent(slug)}`, {
        cache: "no-store",
        headers: cookie ? { Cookie: cookie } : undefined,
        next: { tags: [`company-${slug}`] },
      });

      if (res.ok) {
        const payload = await res.json();
        return payload?.data?.company ?? null;
      }

      if (res.status === 404) {
        sawNotFound = true;
        continue;
      }

      lastError = new Error(`Failed to fetch company: ${res.status}`);
    } catch (error) {
      lastError = error;
    }
  }

  if (sawNotFound) return null;
  throw lastError instanceof Error ? lastError : new Error("Failed to fetch company");
}

export function redirectIfCompanySlugChanged(
  requestedSlug: string,
  canonicalSlug: string,
  suffix = "",
  searchParams?: object,
): void {
  let requested = requestedSlug;
  try {
    requested = decodeURIComponent(requestedSlug);
  } catch {
    requested = requestedSlug;
  }
  if (requested === canonicalSlug) return;

  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string") params.set(key, value);
      else if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "string") params.append(key, item);
        }
      }
    }
  }
  const qs = params.toString();
  permanentRedirect(`/companies/${canonicalSlug}${suffix}${qs ? `?${qs}` : ""}`);
}
