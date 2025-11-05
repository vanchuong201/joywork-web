"use client";

import { create } from "zustand";
import api from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
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

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  memberships: CompanyMembership[];
  setUser: (u: AuthUser | null) => void;
  setLoading: (v: boolean) => void;
  setMemberships: (items: CompanyMembership[]) => void;
  fetchMe: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  memberships: [],
  setUser: (u) => set({ user: u }),
  setLoading: (v) => set({ loading: v }),
  setMemberships: (items) => set({ memberships: items }),
  fetchMe: async () => {
    set({ loading: true });
    try {
      const [{ data: meData }, membershipsRes] = await Promise.all([
        api.get("/api/auth/me"),
        api.get("/api/companies/me/companies"),
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

      set({ user: meData.data.user, memberships });
    } catch (e) {
      // token invalid; clear
      if (typeof window !== "undefined") localStorage.removeItem("accessToken");
      set({ user: null, memberships: [] });
    } finally {
      set({ loading: false });
    }
  },
  signOut: async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (error) {
      // ignore
    }
    if (typeof window !== "undefined") localStorage.removeItem("accessToken");
    set({ user: null, memberships: [] });
  },
}));

export const useAuth = useAuthStore;


