"use client";

import { create } from "zustand";
import api from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
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
      const [{ data: meData }, membershipsRes, followsRes, favoritesRes] = await Promise.all([
        api.get("/api/auth/me"),
        api.get("/api/companies/me/companies"),
        api.get("/api/companies/me/follows"),
        api.get("/api/jobs/me/favorites", { params: { page: 1, limit: 200 } }),
      ]);
      const memberships =
        membershipsRes?.data?.data?.memberships?.map((item: any) => ({
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
        })) ?? [];

      const followedCompanies =
        followsRes?.data?.data?.follows?.map((item: any) => ({
          companyId: item.company.id,
          slug: item.company.slug,
        })) ?? [];

      const savedJobIds =
        favoritesRes?.data?.data?.favorites?.map((item: any) => item.jobId) ?? [];

      const me = meData.data.user;
      const authUser: AuthUser = {
        id: me.id,
        email: me.email,
        name: me.name,
        role: me.role,
        avatar: me.profile?.avatar ?? null,
      };

      set({ user: authUser, memberships, followedCompanies, savedJobIds });
    } catch (e) {
      // token invalid; clear
      if (typeof window !== "undefined") localStorage.removeItem("accessToken");
      set({ user: null, memberships: [], followedCompanies: [], savedJobIds: [] });
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
    if (typeof window !== "undefined") localStorage.removeItem("accessToken");
    set({ user: null, memberships: [], followedCompanies: [], savedJobIds: [], initialized: true, loading: false });
  },
}));

export const useAuth = useAuthStore;


