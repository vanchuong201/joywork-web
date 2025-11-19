import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

let isRefreshing = false;
type QueueItem = {
  retry: () => void;
  reject: (error: unknown) => void;
};
let queue: QueueItem[] = [];

const AUTH_SKIP_REFRESH_PATHS = ["/api/auth/login", "/api/auth/register", "/api/auth/refresh"];

function shouldSkipRefresh(url?: string) {
  if (!url) return false;
  try {
    const parsed = new URL(url, baseURL);
    return AUTH_SKIP_REFRESH_PATHS.some((path) => parsed.pathname === path);
  } catch {
    return AUTH_SKIP_REFRESH_PATHS.some((path) => url.startsWith(path));
  }
}

function flushQueue(error?: unknown) {
  queue.forEach((item) => {
    if (error) {
      item.reject(error);
    } else {
      item.retry();
    }
  });
  queue = [];
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error?.response?.status;

    // ✅ Luôn reject ngay nếu không phải 401 hoặc là auth endpoint
    if (!original || status !== 401 || shouldSkipRefresh(original.url)) {
      return Promise.reject(error);
    }

    // ✅ Nếu đã retry rồi, reject luôn
    if (original._retried) {
      return Promise.reject(error);
    }

    original._retried = true;

    // ✅ Nếu đang refresh, đẩy vào queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          retry: () => {
            const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
            original.headers = original.headers ?? {};
            if (token) {
              (original.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
            } else {
              delete (original.headers as Record<string, string>)["Authorization"];
            }
            resolve(api(original));
          },
          reject: (err) => {
            reject(err);
          },
        });
      });
    }

    // ✅ Bắt đầu refresh
    isRefreshing = true;
    try {
      const { data } = await api.post("/api/auth/refresh");
      const accessToken = data?.data?.accessToken;
      if (typeof window !== "undefined") {
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
        } else {
          localStorage.removeItem("accessToken");
        }
      }
      flushQueue();
      // ✅ Retry request gốc
      original.headers = original.headers ?? {};
      if (accessToken) {
        (original.headers as Record<string, string>)["Authorization"] = `Bearer ${accessToken}`;
      }
      return api(original);
    } catch (refreshError) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
      flushQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;


