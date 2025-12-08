"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useAuthStore } from "@/store/useAuth";
import api from "@/lib/api";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

// Hardcode client ID for now based on provided .env. 
// You should move this to NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env
const GOOGLE_CLIENT_ID = "678571129034-ctf1togp4eu2kdaqiuic8btg48m5ompi.apps.googleusercontent.com";

export default function GoogleOneTap() {
  const user = useAuthStore((state) => state.user);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const loading = useAuthStore((state) => state.loading);
  const initialized = useAuthStore((state) => state.initialized);
  const pathname = usePathname();
  
  // Không hiển thị nếu:
  // 1. Chưa init xong hoặc đang loading auth state
  // 2. Đã login
  // 3. Đang ở các trang Auth (Login, Register...) vì đã có nút login riêng
  const isAuthPage = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"].some(path => pathname?.startsWith(path));
  const shouldShow = initialized && !loading && !user && !isAuthPage;

  const handleCredentialResponse = async (response: any) => {
    try {
      const { data } = await api.post("/api/auth/google/one-tap", {
        credential: response.credential,
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.data.accessToken);
      }
      await fetchMe();
      toast.success("Đăng nhập thành công");
    } catch (error: any) {
      console.error("One Tap Login Error:", error);
      if (error.response) {
          toast.error(error.response.data?.message || "Đăng nhập thất bại");
      }
    }
  };

  const initializeGoogleOneTap = () => {
    const google = (window as any).google;
    if (!google) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      cancel_on_tap_outside: false,
      use_fedcm_for_prompt: true,
    });

    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // console.log("One Tap skipped:", notification.getNotDisplayedReason());
      }
    });
  };

  if (!shouldShow) return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={initializeGoogleOneTap}
    />
  );
}

