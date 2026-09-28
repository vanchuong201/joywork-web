import api from "@/lib/api";
import type { ApplicationDetail } from "@/types/application";

export async function getApplicationDetail(applicationId: string): Promise<ApplicationDetail> {
  const res = await api.get(`/api/jobs/applications/${encodeURIComponent(applicationId)}`);
  return res.data.data as ApplicationDetail;
}

export async function updateApplicationStatus(
  applicationId: string,
  payload: { status: string; notes?: string },
): Promise<void> {
  await api.patch(`/api/jobs/applications/${encodeURIComponent(applicationId)}/status`, payload);
}
