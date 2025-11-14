import api from "@/lib/api";

export type PresignUploadResponse = {
  key: string;
  uploadUrl: string;
  assetUrl: string;
  expiresIn: number;
  maxFileSize: number;
  allowedTypes: string[];
};

export async function createPresignedUpload(companyId: string, file: File): Promise<PresignUploadResponse> {
  const { data } = await api.post("/api/uploads/presign", {
    companyId,
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  });

  return data.data as PresignUploadResponse;
}

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

