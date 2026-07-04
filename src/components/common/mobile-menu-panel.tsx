"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import NavSection from "./nav-section";
import NavFooter from "./nav-footer";
import NavUserCard from "./nav-user-card";
import {
  buildBusinessSpaceNav,
  buildCompanyManageNav,
  buildLeftAdminNav,
  buildLeftExploreNav,
  leftPersonalNav,
  type NavItem,
} from "./navigation-config";

/**
 * Mobile hamburger menu content — mirrors the desktop LeftNav for both auth
 * states. Constrained to the viewport below the 3.5rem header with internal
 * scrolling because the body scroll is locked while the menu is open.
 */
export default function MobileMenuPanel({ id, onNavigate }: { id: string; onNavigate: () => void }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const memberships = useAuthStore((s) => s.memberships);
  const initialized = useAuthStore((s) => s.initialized);
  const loading = useAuthStore((s) => s.loading);
  const { openPrompt } = useAuthPrompt();

  const isReady = initialized && !loading;

  const panelClassName =
    "max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain border-t border-[var(--border)] px-4 py-3 md:hidden";

  if (!isReady) {
    return (
      <div id={id} className={panelClassName}>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  const exploreNav = buildLeftExploreNav();
  const businessSpaceNav = buildBusinessSpaceNav();
  const companyManageNav = user ? buildCompanyManageNav(memberships) : [];
  const adminNav = buildLeftAdminNav(user);
  // Logged out: protected items open the auth prompt, then the menu closes.
  const onProtectedClick = user
    ? undefined
    : (item: NavItem) => {
        openPrompt(item.label);
        onNavigate();
      };

  return (
    <div id={id} className={panelClassName}>
      <nav className="flex flex-col gap-4">
        <NavUserCard onNavigate={onNavigate} />

        <NavSection title="Khám phá" items={exploreNav} pathname={pathname} onNavigate={onNavigate} />

        <NavSection
          title="Không gian của ứng viên"
          items={leftPersonalNav}
          pathname={pathname}
          onProtectedClick={onProtectedClick}
          onNavigate={onNavigate}
        />

        <NavSection
          title="Không gian của doanh nghiệp"
          items={businessSpaceNav}
          pathname={pathname}
          onProtectedClick={onProtectedClick}
          onNavigate={onNavigate}
        />

        {companyManageNav.length > 0 ? (
          <NavSection
            title="Công ty của tôi"
            items={companyManageNav}
            pathname={pathname}
            truncateLabel
            onProtectedClick={onProtectedClick}
            onNavigate={onNavigate}
          />
        ) : null}

        {adminNav.length > 0 ? (
          <NavSection
            title="Hệ thống"
            items={adminNav}
            pathname={pathname}
            onProtectedClick={onProtectedClick}
            onNavigate={onNavigate}
          />
        ) : null}

        <NavFooter />
      </nav>
    </div>
  );
}
