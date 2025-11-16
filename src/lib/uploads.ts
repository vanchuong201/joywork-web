import api from "@/lib/api";

export async function deleteUploadedObject(key: string): Promise<void> {
  await api.delete("/api/uploads/object", {
    data: { key },
  });
}

export async function uploadProfileAvatar(payload: {
  fileName: string;
  fileType: string;
  fileData: string;
  previousKey?: string;
}): Promise<{ key: string; assetUrl: string }> {
  const { data } = await api.post("/api/uploads/profile/avatar", payload);
  return data.data as { key: string; assetUrl: string };
}

export async function uploadCompanyPostImage(payload: {
  companyId: string;
  fileName: string;
  fileType: string;
  fileData: string;
  previousKey?: string;
}): Promise<{ key: string; assetUrl: string }> {
  const { data } = await api.post("/api/uploads/company/post-image", payload);
  return data.data as { key: string; assetUrl: string };
}

export async function uploadCompanyLogo(payload: {
  companyId: string;
  fileName: string;
  fileType: string;
  fileData: string;
  previousKey?: string;
}): Promise<{ key: string; assetUrl: string }> {
  const { data } = await api.post("/api/uploads/company/logo", payload);
  return data.data as { key: string; assetUrl: string };
}

export async function uploadCompanyCover(payload: {
  companyId: string;
  fileName: string;
  fileType: string;
  fileData: string;
  previousKey?: string;
}): Promise<{ key: string; assetUrl: string }> {
  const { data } = await api.post("/api/uploads/company/cover", payload);
  return data.data as { key: string; assetUrl: string };
}

