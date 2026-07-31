"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/company/CompanyLogo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { COMPANY_BADGES, normalizeCompanyBadges, type CompanyBadgeType } from "@/lib/company-badges";

export interface CompanyAvatarProps {
    logoUrl?: string | null;
    /** Tên company — dùng cho alt và fallback chữ cái đầu. */
    name: string;
    /** Kích thước cơ sở (px): quyết định độ dày ring, width/height ảnh. */
    size: number;
    shape?: "circle" | "square";
    /** Danh sách huy hiệu công ty do backend trả về. */
    badges?: Array<CompanyBadgeType | string>;
    /** Ghi đè hiển thị badge (mặc định: hiện khi có badges). */
    badge?: boolean;
    /** Tắt toàn bộ ring gradient + badge (escape hatch). */
    border?: boolean;
    /** Box co giãn theo className thay vì cố định theo size (vd: hero responsive). */
    fluid?: boolean;
    /** Fallback tùy biến khi không có logo (icon Briefcase, Building2…). Mặc định: chữ cái đầu của name. */
    fallback?: React.ReactNode;
    className?: string;
    /** object-cover / object-contain theo từng vị trí. Mặc định: object-contain. */
    imgClassName?: string;
    priority?: boolean;
    /** Slot overlay đè lên ảnh (vd: nút upload ở trang hero). */
    children?: React.ReactNode;
}

/**
 * Tính vị trí & kích thước badge sau khi ảnh đã được cắt bỏ viền trong suốt.
 * Badge nhỏ hơn so với avatar để không lấn át logo, nhưng đủ lớn để nhìn thấy.
 * Tier theo size giúp badge vừa mắt ở mọi cỡ avatar (hero 160px → tiny 24px).
 */
function getBadgeStyle(size: number, shape: "circle" | "square", corner: "left" | "right"): React.CSSProperties {
    // Phần trăm kích thước badge so với avatar: cỡ nhỏ cần to hơn nhưng vẫn đủ chỗ cho 2 badge.
    const pct = size <= 32 ? 38 : size <= 64 ? 34 : 30;

    if (shape === "square") {
        // Square: badge nhô ra góc trên nhiều hơn để tạo hiệu ứng "nhãn"
        const w = pct + 6;
        const offset = `-${Math.round(w * 0.42)}%`;
        return {
            width: `${w}%`,
            height: `${w}%`,
            top: `-${Math.round(w * 0.38)}%`,
            ...(corner === "left" ? { left: offset } : { right: offset }),
        };
    }
    // Circle: badge bám sát góc trên và hơi nhô ra ngoài cạnh.
    return {
        width: `${pct}%`,
        height: `${pct}%`,
        top: size >= 80 ? "0%" : `-${Math.round(pct * 0.15)}%`,
        ...(corner === "left"
            ? { left: `-${Math.round(pct * 0.35)}%` }
            : { right: `-${Math.round(pct * 0.35)}%` }),
    };
}

/** Bo góc cho biến thể vuông theo tier kích thước; ring ngoài bo lớn hơn 1 nấc để ôm khít. */
function squareRadii(size: number): { outer: string; inner: string } {
    if (size <= 32) return { outer: "rounded-lg", inner: "rounded-md" };
    if (size < 80) return { outer: "rounded-xl", inner: "rounded-lg" };
    return { outer: "rounded-[1.25rem]", inner: "rounded-2xl" };
}

function fallbackTextClass(size: number): string {
    if (size <= 32) return "text-[10px]";
    if (size < 80) return "text-base";
    return "text-4xl";
}

/**
 * Avatar company chuẩn JoyWork: ring gradient hồng→tím→xanh + khoảng trắng + badges
 * (theo public/badge/badge-and-border-{circle,square}.png).
 */
export function CompanyAvatar({
    logoUrl,
    name,
    size,
    shape = "circle",
    badges,
    badge,
    border = true,
    fluid = false,
    fallback,
    className,
    imgClassName,
    priority = false,
    children,
}: CompanyAvatarProps) {
    const isSmall = size <= 32;
    const normalizedBadges = normalizeCompanyBadges(badges);
    const showRing = border && normalizedBadges.length > 0;
    const showBadges = showRing && (badge ?? true);
    const ringPx = isSmall ? 2 : 3;
    // Avatar nhỏ bỏ khoảng trắng giữa ring và ảnh để không bóp ảnh quá mức.
    const gapPx = isSmall ? 0 : size >= 80 ? 3 : 2;

    const radii =
        shape === "circle"
            ? { outer: "rounded-full", inner: "rounded-full" }
            : squareRadii(size);

    return (
        <div
            className={cn("relative shrink-0", className)}
            style={fluid ? undefined : { width: size, height: size }}
        >
            <div
                className={cn(
                    "h-full w-full",
                    radii.outer,
                    showRing
                        ? "bg-gradient-to-tr from-[#f0218c] via-[#8b3fd9] to-[#2563eb]"
                        : "border border-[var(--border)]",
                )}
                style={{ padding: showRing ? ringPx : 0 }}
            >
                <div
                    className={cn("h-full w-full bg-[var(--card)]", radii.inner)}
                    style={{ padding: showRing ? gapPx : 0 }}
                >
                    <div className={cn("relative h-full w-full overflow-hidden bg-[var(--card)]", radii.inner)}>
                        {logoUrl ? (
                            <CompanyLogo
                                src={logoUrl}
                                alt={name}
                                width={size}
                                height={size}
                                priority={priority}
                                className={cn("h-full w-full", radii.inner, imgClassName ?? "object-contain")}
                            />
                        ) : (
                            fallback ?? (
                                <div
                                    className={cn(
                                        "flex h-full w-full items-center justify-center bg-[var(--muted)] font-semibold text-[var(--muted-foreground)]",
                                        radii.inner,
                                        fallbackTextClass(size),
                                    )}
                                >
                                    {name.charAt(0).toUpperCase()}
                                </div>
                            )
                        )}
                        {children}
                    </div>
                </div>
            </div>

            {showBadges && (
                <TooltipProvider delayDuration={200}>
                    {normalizedBadges.map((badgeType) => {
                        const badgeMeta = COMPANY_BADGES[badgeType];
                        return (
                            <Tooltip key={badgeType}>
                                <TooltipTrigger asChild>
                                    <div
                                        className="absolute z-20 cursor-help"
                                        style={getBadgeStyle(size, shape, badgeMeta.corner)}
                                    >
                                        <Image
                                            src={badgeMeta.icon}
                                            alt={badgeMeta.alt}
                                            width={56}
                                            height={56}
                                            className="h-full w-full drop-shadow-md"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[260px] text-center leading-relaxed">
                                    {badgeMeta.tooltip}{" "}
                                    <Link
                                        href={badgeMeta.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline underline-offset-2 hover:text-[var(--brand)]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Xem chi tiết tại đây.
                                    </Link>
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </TooltipProvider>
            )}
        </div>
    );
}
