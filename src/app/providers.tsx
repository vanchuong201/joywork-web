"use client";

import { ReactQueryProvider } from "@/lib/query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuth";
import { hasStoredAccessToken } from "@/lib/auth-token";
import { AuthPromptProvider } from "@/contexts/AuthPromptContext";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Providers({ children }: PropsWithChildren) {
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const markInitialized = useAuthStore((s) => s.markInitialized);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasStoredAccessToken()) {
      fetchMe();
    } else {
      markInitialized();
    }
  }, [fetchMe, markInitialized]);
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <ReactQueryProvider>
        <TooltipProvider delayDuration={200}>
          <AuthPromptProvider>
            {children}
            <Toaster richColors />
          </AuthPromptProvider>
        </TooltipProvider>
      </ReactQueryProvider>
    </ThemeProvider>
  );
}


