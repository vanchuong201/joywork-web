import type { AxiosError, AxiosResponse } from "axios";
import api from "@/lib/api";

type DownloadCvPdfOptions = {
  url: string;
  params?: Record<string, string>;
  fallbackFileName: string;
};

function parseFileNameFromDisposition(value?: string): string | null {
  if (!value) return null;
  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      return utf8Match[1].trim();
    }
  }

  const simpleMatch = value.match(/filename="?([^";]+)"?/i);
  if (simpleMatch?.[1]) {
    return simpleMatch[1].trim();
  }

  return null;
}

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

async function parseBlobErrorMessage(
  response?: AxiosResponse<Blob>,
): Promise<string | null> {
  if (!response?.data) return null;
  if (!(response.data instanceof Blob)) return null;
  if (response.data.type !== "application/json") return null;

  try {
    const text = await response.data.text();
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    const message = parsed.error?.message?.trim();
    return message || null;
  } catch {
    return null;
  }
}

async function downloadCvPdf(
  options: DownloadCvPdfOptions,
): Promise<{ fileName: string }> {
  try {
    const response = await api.get<Blob>(options.url, {
      params: options.params,
      responseType: "blob",
      headers: {
        Accept: "application/pdf",
      },
    });

    const fileName =
      parseFileNameFromDisposition(response.headers["content-disposition"]) ||
      options.fallbackFileName;

    triggerBrowserDownload(response.data, fileName);
    return { fileName };
  } catch (error: unknown) {
    const axiosError = error as AxiosError<Blob>;
    const response = axiosError.response;
    const message = await parseBlobErrorMessage(response);
    if (message) {
      throw new Error(message);
    }
    throw new Error("Không thể xuất CV PDF lúc này. Vui lòng thử lại.");
  }
}

export async function downloadMyCvPdf() {
  return downloadCvPdf({
    url: "/api/cv-exports/me/pdf",
    fallbackFileName: "joywork-cv.pdf",
  });
}

export async function downloadCandidateCvPdf(
  slug: string,
  companyId: string,
  masked: boolean,
) {
  const suffix = masked ? "-masked" : "";
  return downloadCvPdf({
    url: `/api/cv-exports/candidates/${encodeURIComponent(slug)}/pdf`,
    params: { companyId },
    fallbackFileName: `joywork-cv${suffix}.pdf`,
  });
}
