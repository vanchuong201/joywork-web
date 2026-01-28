"use client";

import { create } from "zustand";
import api from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
  emailVerified?: boolean;
  name?: string | null;
  role?: string;
  avatar?: string | null;
};

export type CompanyMembership = {
  membershipId: string;
  role: string;
  company: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
    coverUrl?: string | null;
    tagline?: string | null;
  };
};

export type FollowedCompany = {
  companyId: string;
  slug: string;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  memberships: CompanyMembership[];
  followedCompanies: FollowedCompany[];
  savedJobIds: string[];
  initialized: boolean;
  setUser: (u: AuthUser | null) => void;
  setLoading: (v: boolean) => void;
  setMemberships: (items: CompanyMembership[]) => void;
  setFollowedCompanies: (items: FollowedCompany[]) => void;
  addFollowedCompany: (item: FollowedCompany) => void;
  removeFollowedCompany: (companyId: string) => void;
  setSavedJobIds: (ids: string[]) => void;
  addSavedJob: (jobId: string) => void;
  removeSavedJob: (jobId: string) => void;
  markInitialized: () => void;
  fetchMe: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  memberships: [],
  followedCompanies: [],
  savedJobIds: [],
  initialized: false,
  setUser: (u) => set({ user: u }),
  setLoading: (v) => set({ loading: v }),
  setMemberships: (items) => set({ memberships: items }),
  setFollowedCompanies: (items) => set({ followedCompanies: items }),
  addFollowedCompany: (item) =>
    set((state) => {
      if (state.followedCompanies.some((entry) => entry.companyId === item.companyId)) {
        return {};
      }
      return { followedCompanies: [...state.followedCompanies, item] };
    }),
  removeFollowedCompany: (companyId) =>
    set((state) => ({
      followedCompanies: state.followedCompanies.filter((entry) => entry.companyId !== companyId),
    })),
  setSavedJobIds: (ids) => set({ savedJobIds: ids }),
  addSavedJob: (jobId) =>
    set((state) => {
      if (state.savedJobIds.includes(jobId)) return {};
      return { savedJobIds: [...state.savedJobIds, jobId] };
    }),
  removeSavedJob: (jobId) =>
    set((state) => ({
      savedJobIds: state.savedJobIds.filter((id) => id !== jobId),
    })),
  markInitialized: () => set({ initialized: true, loading: false }),
  fetchMe: async () => {
    set({ loading: true });
    try {
      // First, fetch user data - this is critical
      const { data: meData } = await api.get("/api/auth/me");
      const me = meData.data.user;
      
      const authUser: AuthUser = {
        id: me.id,
        email: me.email,
        emailVerified: me.emailVerified,
        name: me.name,
        role: me.role,
        // Ưu tiên avatar từ User model (account avatar), sau đó mới fallback về profile avatar
        avatar: me.avatar ?? me.profile?.avatar ?? null,
      };

      // Then fetch other data in parallel - these are optional and failures shouldn't clear user
      const [membershipsRes, followsRes, favoritesRes] = await Promise.allSettled([
        api.get("/api/companies/me/companies"),
        api.get("/api/companies/me/follows"),
        api.get("/api/jobs/me/favorites", { params: { page: 1, limit: 200 } }),
      ]);

      const memberships =
        membershipsRes.status === "fulfilled"
          ? membershipsRes.value?.data?.data?.memberships?.map((item: any) => ({
              membershipId: item.membershipId,
              role: item.role,
              company: {
                id: item.company.id,
                name: item.company.name,
                slug: item.company.slug,
                logoUrl: item.company.logoUrl,
                coverUrl: item.company.coverUrl,
                tagline: item.company.tagline,
              },
            })) ?? []
          : [];

      const followedCompanies =
        followsRes.status === "fulfilled"
          ? followsRes.value?.data?.data?.follows?.map((item: any) => ({
              companyId: item.company.id,
              slug: item.company.slug,
            })) ?? []
          : [];

      const savedJobIds =
        favoritesRes.status === "fulfilled"
          ? favoritesRes.value?.data?.data?.favorites?.map((item: any) => item.jobId) ?? []
          : [];

      set({ user: authUser, memberships, followedCompanies, savedJobIds });
    } catch (e: any) {
      // Only clear user if /api/auth/me fails (401/403) - this means token is invalid
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        // token invalid; clear
        if (typeof window !== "undefined") localStorage.removeItem("accessToken");
        set({ user: null, memberships: [], followedCompanies: [], savedJobIds: [] });
      } else {
        // For other errors, keep existing user data but mark as initialized
        // This prevents clearing user on network errors or temporary API issues
        console.error("Failed to fetch some user data:", e);
      }
    } finally {
      set({ loading: false, initialized: true });
    }
  },
  signOut: async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      // ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      // Clear all user data and redirect to home
      set({ user: null, memberships: [], followedCompanies: [], savedJobIds: [], initialized: true, loading: false });
      // Redirect to home page after logout
      window.location.href = "/";
    } else {
      set({ user: null, memberships: [], followedCompanies: [], savedJobIds: [], initialized: true, loading: false });
    }
  },
}));

export const useAuth = useAuthStore;


