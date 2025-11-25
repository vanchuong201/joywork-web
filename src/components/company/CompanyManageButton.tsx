"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuth";
import { cn } from "@/lib/utils";
import { Settings } from "lucide-react";

type CompanyManageButtonProps = {
  slug: string;
  className?: string;
};

export default function CompanyManageButton({ slug, className }: CompanyManageButtonProps) {
  const memberships = useAuthStore((s) => s.memberships);

  const canManage = memberships.some(
    (membership) => membership.company.slug === slug && (membership.role === "OWNER" || membership.role === "ADMIN")
  );

  if (!canManage) {
    return null;
  }

  return (
    <Button
      asChild
      size="icon"
      variant="outline"
      className={cn("border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)]/10 ml-auto", className)}
      title="Quản trị công ty"
    >
      <Link href={`/companies/${slug}/manage`}>
        <Settings className="h-4 w-4" />
      </Link>
    </Button>
  );
}

