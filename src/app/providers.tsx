"use client";

import { ReactQueryProvider } from "@/lib/query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { PropsWithChildren } from "react";
import { useEffect } from "react";
import { useAuth } from "@/store/useAuth";

export default function Providers({ children }: PropsWithChildren) {
  const fetchMe = useAuth((s) => s.fetchMe);
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("accessToken")) {
      fetchMe();
    }
  }, [fetchMe]);
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <ReactQueryProvider>
        {children}
        <Toaster richColors />
      </ReactQueryProvider>
    </ThemeProvider>
  );
}


