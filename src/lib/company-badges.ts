export type CompanyBadgeType = "GOOD_COMPANY" | "BASIC_COMMITMENT";

type CompanyBadgeMeta = {
  icon: string;
  corner: "left" | "right";
  alt: string;
  tooltip: string;
  href: string;
};

export const COMPANY_BADGES: Record<CompanyBadgeType, CompanyBadgeMeta> = {
  GOOD_COMPANY: {
    icon: "/badge/badge.png",
    corner: "left",
    alt: "Huy hiệu doanh nghiệp tốt",
    tooltip: "Đây là Huy hiệu chứng nhận Doanh Nghiệp có môi trường làm việc tốt.",
    href: "https://doanhnghieptot.joywork.vn",
  },
  BASIC_COMMITMENT: {
    icon: "/badge/badge-commitment.png",
    corner: "right",
    alt: "Huy hiệu doanh nghiệp cam kết đạt chuẩn",
    tooltip:
      "Đây là Huy hiệu cho Doanh Nghiệp đã cam kết đạt chuẩn điều kiện làm việc cơ bản theo tiêu chí của JOBVUI và JOYWORK.",
    href: "https://camket.joywork.vn/",
  },
};

const COMPANY_BADGE_ORDER: CompanyBadgeType[] = ["GOOD_COMPANY", "BASIC_COMMITMENT"];

export function normalizeCompanyBadges(input: Array<string | CompanyBadgeType> | null | undefined): CompanyBadgeType[] {
  if (!Array.isArray(input) || input.length === 0) {
    return [];
  }

  const badgeSet = new Set(input);
  return COMPANY_BADGE_ORDER.filter((badge) => badgeSet.has(badge));
}
