import api from "@/lib/api";
import type {
  CvImportApplyMode,
  CvImportJob,
  CvImportSection,
} from "@/types/cv-import";

export async function createCvImport(input: {
  cvUrl?: string | null;
  sourceKey?: string | null;
}): Promise<CvImportJob> {
  const payload: Record<string, string> = {};
  if (input.cvUrl) payload.cvUrl = input.cvUrl;
  if (input.sourceKey) payload.sourceKey = input.sourceKey;
  const res = await api.post("/api/cv-imports", payload);
  return res.data.data.job as CvImportJob;
}

export async function getCvImport(jobId: string): Promise<CvImportJob> {
  const res = await api.get(`/api/cv-imports/${encodeURIComponent(jobId)}`);
  return res.data.data.job as CvImportJob;
}

export async function applyCvImport(
  jobId: string,
  input: { mode: CvImportApplyMode; sections: CvImportSection[] }
): Promise<CvImportJob> {
  const res = await api.post(`/api/cv-imports/${encodeURIComponent(jobId)}/apply`, input);
  return res.data.data.job as CvImportJob;
}
