const API_BASE_CANDIDATES = Array.from(
  new Set(
    [
      process.env.INTERNAL_API_BASE_URL,
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
      "http://127.0.0.1:4000",
      "http://localhost:4000",
    ].filter(Boolean),
  ),
) as string[];

export async function fetchSitemapPayload<T>(path: string): Promise<T> {
  let lastStatus = 0;
  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      const res = await fetch(`${baseUrl}${path}`, { next: { revalidate: 3600 } });
      if (res.ok) return (await res.json()) as T;
      lastStatus = res.status;
    } catch {
      lastStatus = 0;
    }
  }
  throw new Error(`Sitemap upstream failed${lastStatus ? ` (${lastStatus})` : ""}`);
}
