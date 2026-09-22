import type { Metadata } from "next";
import type { ReactNode } from "react";

const title = "Giới thiệu JOYWORK - Nền tảng tuyển dụng của các doanh nghiệp tốt";
const description =
  "Tìm hiểu về JOYWORK - nền tảng giúp doanh nghiệp kể câu chuyện văn hóa thật, kết nối đúng ứng viên phù hợp cả về kỹ năng và giá trị.";

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

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
