"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TalentPoolPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/candidates?tab=talent-pool");
  }, [router]);

  return null;
}
