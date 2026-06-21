type JobCompany = {
  name: string;
  slug: string;
};

export type JobForOpenGraph = {
  id: string;
  title: string;
  slug?: string | null;
  mission?: string | null;
  generalInfo?: string | null;
  company: JobCompany;
};

type JobApiResponse = { data?: { job?: JobForOpenGraph | null } };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

const API_BASE_CANDIDATES = Array.from(
  new Set(
    [process.env.INTERNAL_API_BASE_URL, API_BASE_URL, "http://127.0.0.1:4000", "http://localhost:4000"].filter(
      Boolean,
    ),
  ),
) as string[];

export type FetchJobForOpenGraphResult = {
  job: JobForOpenGraph | null;
  /** true nếu ít nhất một base trả 404 (tin không tồn tại), không chỉ lỗi mạng */
  definitiveNotFound: boolean;
};

export async function fetchJobForOpenGraph(jobId: string): Promise<FetchJobForOpenGraphResult> {
  let definitiveNotFound = false;

  for (const baseUrl of API_BASE_CANDIDATES) {
    try {
      const res = await fetch(`${baseUrl}/api/jobs/${jobId}`, {
        next: { revalidate: 120, tags: [`job-og-${jobId}`] },
      });

      if (res.ok) {
        const payload = (await res.json()) as JobApiResponse;
        return { job: payload?.data?.job ?? null, definitiveNotFound: false };
      }

      if (res.status === 404) {
        definitiveNotFound = true;
        continue;
      }
    } catch {
      // thử base tiếp theo
    }
  }

  return { job: null, definitiveNotFound };
}
