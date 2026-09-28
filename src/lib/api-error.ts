type ApiErrorBody = { error?: { code?: string; message?: string } };

function readApiError(error: unknown): ApiErrorBody["error"] | undefined {
  if (!error || typeof error !== "object") return undefined;
  return (error as { response?: { data?: ApiErrorBody } }).response?.data?.error;
}

export function getApiErrorCode(error: unknown): string | undefined {
  return readApiError(error)?.code;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const message = readApiError(error)?.message;
  if (message) return message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
