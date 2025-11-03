import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

let isRefreshing = false;
let queue: Array<() => void> = [];

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
    if (error?.response?.status === 401 && !original?._retried) {
      original._retried = true;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const { data } = await api.post("/api/auth/refresh");
          if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", data.accessToken);
          }
          queue.forEach((fn) => fn());
          queue = [];
        } finally {
          isRefreshing = false;
        }
      }
      return new Promise((resolve) => {
        queue.push(async () => {
          const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
          original.headers = original.headers ?? {};
          if (token) (original.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }
    return Promise.reject(error);
  }
);

export default api;


