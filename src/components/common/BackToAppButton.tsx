"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BackToAppButton() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleBack} className="gap-1.5">
      <ArrowLeft className="h-4 w-4" />
      Quay lại ứng dụng
    </Button>
  );
}

