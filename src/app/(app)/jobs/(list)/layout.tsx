import type { Metadata } from "next";
import type { ReactNode } from "react";

const title = "Tìm Việc Làm Mới Nhất Từ Những Doanh Nghiệp Tốt | JOYWORK";
const description =
  "Khám phá hàng trăm tin tuyển dụng mới nhất từ các doanh nghiệp uy tín. Lọc theo ngành nghề, khu vực, mức lương - Ứng tuyển ngay tại JOYWORK.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
  },
  twitter: {
    title,
    description,
  },
};

export default function JobsListLayout({ children }: { children: ReactNode }) {
  return children;
}
