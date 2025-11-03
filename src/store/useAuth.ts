"use client";

import { create } from "zustand";
import api from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  setLoading: (v: boolean) => void;
  fetchMe: () => Promise<void>;
  signOut: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  setUser: (u) => set({ user: u }),
  setLoading: (v) => set({ loading: v }),
  fetchMe: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/api/auth/me");
      set({ user: data.data.user });
    } catch (e) {
      // token invalid; clear
      if (typeof window !== "undefined") localStorage.removeItem("accessToken");
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },
  signOut: () => {
    if (typeof window !== "undefined") localStorage.removeItem("accessToken");
    set({ user: null });
  },
}));


