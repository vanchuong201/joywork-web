import api from "@/lib/api";
import type {
  CandidateCvDetail,
  CandidateCvList,
  JobSearchSettings,
  OwnAccount,
} from "@/types/candidate-cv";
import type { UserEducation, UserExperience } from "@/types/user";

const cvPath = (cvId: string) => `/api/candidate-cvs/${encodeURIComponent(cvId)}`;

export async function listCandidateCvs(): Promise<CandidateCvList> {
  const res = await api.get("/api/candidate-cvs");
  return res.data.data as CandidateCvList;
}

export async function getCandidateCv(cvId: string): Promise<CandidateCvDetail> {
  const res = await api.get(cvPath(cvId));
  return res.data.data.cv as CandidateCvDetail;
}

export async function createCandidateCv(name: string): Promise<CandidateCvDetail> {
  const res = await api.post("/api/candidate-cvs", { name });
  return res.data.data.cv as CandidateCvDetail;
}

export async function updateCandidateCv(
  cvId: string,
  payload: Record<string, unknown>,
): Promise<CandidateCvDetail> {
  const res = await api.patch(cvPath(cvId), payload);
  return res.data.data.cv as CandidateCvDetail;
}

export async function duplicateCandidateCv(cvId: string, name?: string): Promise<CandidateCvDetail> {
  const res = await api.post(`${cvPath(cvId)}/duplicate`, name ? { name } : {});
  return res.data.data.cv as CandidateCvDetail;
}

export async function deleteCandidateCv(cvId: string): Promise<void> {
  await api.delete(cvPath(cvId));
}

export async function setDefaultCandidateCv(cvId: string): Promise<CandidateCvList> {
  const res = await api.post(`${cvPath(cvId)}/set-default`);
  return res.data.data as CandidateCvList;
}

export async function createCvExperience(cvId: string, data: unknown): Promise<UserExperience> {
  const res = await api.post(`${cvPath(cvId)}/experiences`, data);
  return res.data.data.experience as UserExperience;
}

export async function updateCvExperience(cvId: string, itemId: string, data: unknown): Promise<UserExperience> {
  const res = await api.patch(`${cvPath(cvId)}/experiences/${encodeURIComponent(itemId)}`, data);
  return res.data.data.experience as UserExperience;
}

export async function deleteCvExperience(cvId: string, itemId: string): Promise<void> {
  await api.delete(`${cvPath(cvId)}/experiences/${encodeURIComponent(itemId)}`);
}

export async function createCvEducation(cvId: string, data: unknown): Promise<UserEducation> {
  const res = await api.post(`${cvPath(cvId)}/educations`, data);
  return res.data.data.education as UserEducation;
}

export async function updateCvEducation(cvId: string, itemId: string, data: unknown): Promise<UserEducation> {
  const res = await api.patch(`${cvPath(cvId)}/educations/${encodeURIComponent(itemId)}`, data);
  return res.data.data.education as UserEducation;
}

export async function deleteCvEducation(cvId: string, itemId: string): Promise<void> {
  await api.delete(`${cvPath(cvId)}/educations/${encodeURIComponent(itemId)}`);
}

export async function getJobSearchSettings(): Promise<JobSearchSettings> {
  const res = await api.get("/api/users/me/job-search-settings");
  return res.data.data as JobSearchSettings;
}

export async function updateJobSearchSettings(
  payload: Partial<Pick<JobSearchSettings, "isSearchingJob" | "allowCvFlip">>,
): Promise<JobSearchSettings> {
  const res = await api.patch("/api/users/me/job-search-settings", payload);
  return res.data.data as JobSearchSettings;
}

export async function getOwnAccount(): Promise<OwnAccount> {
  const res = await api.get("/api/users/me");
  return res.data.data.user as OwnAccount;
}
