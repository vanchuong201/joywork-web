"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import NavSection from "./nav-section";
import NavFooter, { StaticPageLinks } from "./nav-footer";
import NavUserCard from "./nav-user-card";
import {
  buildBusinessSpaceNav,
  buildCompanyManageNav,
  buildLeftAdminNav,
  leftPersonalNav,
  type NavItem,
} from "./navigation-config";

export default function LeftNav() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const memberships = useAuthStore((s) => s.memberships);
  const initialized = useAuthStore((s) => s.initialized);
  const loading = useAuthStore((s) => s.loading);
  const { openPrompt } = useAuthPrompt();

  const isReady = initialized && !loading;

  if (!isReady) {
    return (
      <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] md:sticky md:top-24 md:block md:h-[calc(100vh-6rem)]">
        <div className="flex h-full flex-col gap-4 p-4">
          <Skeleton className="h-16 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
          <Skeleton className="h-28 rounded-md" />
          <StaticPageLinks />
        </div>
      </aside>
    );
  }

  const personalNav = leftPersonalNav;
  const businessSpaceNav = buildBusinessSpaceNav();
  const companyManageNav = user ? buildCompanyManageNav(memberships) : [];
  const adminNav = buildLeftAdminNav(user);
  const onProtectedClick = user ? undefined : (item: NavItem) => openPrompt(item.label);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] md:sticky md:top-24 md:block md:h-[calc(100vh-6rem)]">
      <nav className="flex h-full flex-col p-4">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
          <NavUserCard />

          <NavSection
            title="Không gian của ứng viên"
            items={personalNav}
            pathname={pathname}
            onProtectedClick={onProtectedClick}
          />

          <NavSection
            title="Không gian của doanh nghiệp"
            items={businessSpaceNav}
            pathname={pathname}
            onProtectedClick={onProtectedClick}
          />

          {companyManageNav.length > 0 ? (
            <NavSection
              title="Công ty của tôi"
              items={companyManageNav}
              pathname={pathname}
              truncateLabel
              onProtectedClick={onProtectedClick}
            />
          ) : null}

          {adminNav.length > 0 ? (
            <NavSection title="Hệ thống" items={adminNav} pathname={pathname} onProtectedClick={onProtectedClick} />
          ) : null}
        </div>

        <NavFooter className="mt-3 shrink-0" />
      </nav>
    </aside>
  );
}
