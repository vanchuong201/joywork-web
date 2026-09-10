import type { Metadata } from "next";
import type { ReactNode } from "react";

const title = "Danh Sách Doanh Nghiệp Đang Tuyển Dụng | JOYWORK";
const description =
  "Khám phá hồ sơ văn hóa và tin tuyển dụng của các doanh nghiệp đang tuyển tại JOYWORK. Tìm môi trường làm việc phù hợp với bạn.";

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

export default function CompaniesListLayout({ children }: { children: ReactNode }) {
  return children;
}
