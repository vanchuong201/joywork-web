/** Kiểm tra accessToken trong localStorage có vẻ hợp lệ (tránh gọi /me với giá trị rác). */
export function hasStoredAccessToken(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return false;
  }
  const trimmed = token.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return false;
  }
  return trimmed.length >= 20;
}

export function clearStoredAccessToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
  }
}
