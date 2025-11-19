"use client";

import { ReactQueryProvider } from "@/lib/query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuth";
import { AuthPromptProvider } from "@/contexts/AuthPromptContext";

export default function Providers({ children }: PropsWithChildren) {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const markInitialized = useAuthStore((s) => s.markInitialized);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchMe();
    } else {
      markInitialized();
    }
  }, [fetchMe, markInitialized]);
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <ReactQueryProvider>
        <AuthPromptProvider>
          {children}
          <Toaster richColors />
        </AuthPromptProvider>
      </ReactQueryProvider>
    </ThemeProvider>
  );
}


