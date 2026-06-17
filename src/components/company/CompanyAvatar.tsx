"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CompanyLogo } from "@/components/company/CompanyLogo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface CompanyAvatarProps {
    logoUrl?: string | null;
    /** Tên company — dùng cho alt và fallback chữ cái đầu. */
    name: string;
    /** Kích thước cơ sở (px): quyết định độ dày ring, width/height ảnh. */
    size: number;
    shape?: "circle" | "square";
    /** Cờ "Good Company" do admin đánh dấu — quyết định có ring gradient + badge hay không. */
    isGood?: boolean;
    /** Ghi đè hiển thị badge (mặc định: hiện khi isGood=true). */
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
 * Avatar company chuẩn JoyWork: ring gradient hồng→tím→xanh + khoảng trắng + badge ngôi sao
 * (theo public/badge/badge-and-border-{circle,square}.png).
 */
export function CompanyAvatar({
    logoUrl,
    name,
    size,
    shape = "circle",
    isGood = false,
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
    // Ring gradient + badge chỉ dành cho company được admin đánh dấu Good.
    const showRing = border && isGood;
    // Badge luôn hiện với mọi kích thước khi isGood; prop badge là override tắt/bật thủ công.
    const showBadge = showRing && (badge ?? true);
    const ringPx = isSmall ? 2 : 3;
    // Avatar nhỏ bỏ khoảng trắng giữa ring và ảnh để không bóp ảnh quá mức.
    const gapPx = isSmall ? 0 : size >= 80 ? 3 : 2;

    const radii =
        shape === "circle"
            ? { outer: "rounded-full", inner: "rounded-full" }
            : squareRadii(size);

    // Badge lớn hơn để dễ nhìn; có thể che nhẹ góc avatar — cố ý theo yêu cầu.
    const badgeStyle =
        shape === "square"
            ? { width: "65%", height: "65%", top: "-28%", left: "-30%" }
            : { width: "80%", height: "80%", top: "-30%", left: "-30%" };

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

            {showBadge && (
                <TooltipProvider delayDuration={200}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="absolute z-20 cursor-help"
                                style={badgeStyle}
                            >
                                <Image
                                    src="/badge/badge.png"
                                    alt="Huy hiệu doanh nghiệp tốt"
                                    width={56}
                                    height={56}
                                    className="h-full w-full drop-shadow-md"
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px] text-center leading-relaxed">
                            Đây là Huy hiệu chứng nhận Doanh Nghiệp có môi trường làm việc tốt.{" "}
                            <Link
                                href="https://doanhnghieptot.joywork.vn"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-2 hover:text-[var(--brand)]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                Xem chi tiết tại đây.
                            </Link>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
}
