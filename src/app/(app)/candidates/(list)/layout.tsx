import type { Metadata } from "next";
import type { ReactNode } from "react";

const title = "Dành Cho Ứng Viên - Tìm Việc Theo Văn Hóa Phù Hợp | JOYWORK";
const description =
  "JOYWORK giúp ứng viên tìm việc làm phù hợp cả về năng lực và văn hóa doanh nghiệp. Tạo hồ sơ, khám phá công ty, ứng tuyển dễ dàng.";

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

export default function CandidatesListLayout({ children }: { children: ReactNode }) {
  return children;
}
