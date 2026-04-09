import { cn } from "@/lib/utils";

export interface CompanyLogoProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  /** Ưu tiên tải sớm (ví dụ logo hero trang công ty). */
  priority?: boolean;
}

/**
 * Logo công ty từ URL API (S3, import, CDN ngoài…).
 * Dùng thẻ img thay vì next/image để không phụ thuộc remotePatterns.
 */
export function CompanyLogo({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
}: CompanyLogoProps) {
  return (
    // Logo công ty từ URL bất kỳ — không dùng next/image để tránh remotePatterns.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn(className)}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
