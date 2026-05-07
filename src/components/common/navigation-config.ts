import {
  Home,
  Briefcase,
  Building2,
  Settings,
  ClipboardList,
  UserRound,
  Bookmark,
  Heart,
  MessageSquareText,
  Sparkles,
  FileQuestion,
  GraduationCap,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AuthUser, CompanyMembership } from "@/store/useAuth";

export type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  exact?: boolean;
  badge?: string;
  external?: boolean;
};

export type AccountDropdownItem = {
  label: string;
  href: string;
};

const exploreNavBase: NavItem[] = [
  { icon: Home, label: "Bảng tin", href: "/" },
  { icon: Briefcase, label: "Việc làm", href: "/jobs" },
  { icon: Building2, label: "Doanh nghiệp", href: "/companies" },
  { icon: Users, label: "Ứng viên", href: "/candidates" },
  { icon: GraduationCap, label: "Khóa học", href: "/courses" },
  { icon: Sparkles, label: "Talent Pool", href: "/candidates?tab=talent-pool" },
];

const headerAdminNavItem: NavItem = {
  icon: Settings,
  label: "Hệ thống",
  href: "/system",
};

const leftAdminNavItem: NavItem = {
  icon: ClipboardList,
  label: "Kiểm duyệt",
  href: "/system",
};

export const leftPersonalNav: NavItem[] = [
  { icon: UserRound, label: "Hồ sơ của tôi", href: "/account" },
  { icon: ClipboardList, label: "Ứng tuyển của tôi", href: "/applications" },
  { icon: Bookmark, label: "Đã lưu", href: "/saved" },
  { icon: Heart, label: "Công ty theo dõi", href: "/following" },
  { icon: MessageSquareText, label: "Trao đổi với DN", href: "/tickets" },
];

export const mobilePersonalNav: NavItem[] = leftPersonalNav.filter((item) => item.href !== "/account");

export const accountDropdownItems: AccountDropdownItem[] = [
  { label: "Quản lý tài khoản", href: "/account" },
  { label: "CV của tôi", href: "/account/profile" },
];

export function buildHeaderExploreNav(user: AuthUser | null): NavItem[] {
  const internalSurveyItem: NavItem = user
    ? {
        icon: FileQuestion,
        label: "Khảo sát nội bộ",
        href: "https://survey.joywork.vn/",
        external: true,
      }
    : {
        icon: FileQuestion,
        label: "Khảo sát nội bộ",
        href: "/login?redirect=%2F",
      };
  const baseItems = user ? exploreNavBase : exploreNavBase.filter((item) => item.href !== "/jobs");
  const items = [...baseItems, internalSurveyItem];
  if (user?.role === "ADMIN") {
    return [...items, headerAdminNavItem];
  }
  return items;
}

export function buildLeftExploreNav(): NavItem[] {
  return [...exploreNavBase];
}

export function buildLeftAdminNav(user: AuthUser | null): NavItem[] {
  if (user?.role === "ADMIN") {
    return [leftAdminNavItem];
  }
  return [];
}

export function buildCompanyManageNav(memberships: CompanyMembership[]): NavItem[] {
  return memberships
    .filter((membership) => isValidCompanySlug(membership.company.slug))
    .map((membership) => ({
      icon: Building2,
      label: membership.company.name,
      href: `/companies/${membership.company.slug}/manage`,
    }));
}

export function isNavItemActive(pathname: string, item: Pick<NavItem, "href" | "exact" | "external">): boolean {
  if (item.external) return false;
  const normalizedHref = item.href.split("?")[0];
  if (item.exact) return pathname === normalizedHref;
  if (normalizedHref === "/") return pathname === "/";
  return pathname.startsWith(normalizedHref);
}

function isValidCompanySlug(slug: string | null | undefined): slug is string {
  return Boolean(slug && typeof slug === "string" && slug.trim() !== "" && !slug.includes("[") && !slug.includes("]"));
}
