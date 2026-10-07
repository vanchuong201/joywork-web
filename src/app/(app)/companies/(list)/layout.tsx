import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { companiesListCanonical } from "@/lib/seo-url-metadata";

const title = "Danh Sách Doanh Nghiệp Đang Tuyển Dụng | JOYWORK";
const description =
  "Khám phá hồ sơ văn hóa và tin tuyển dụng của các doanh nghiệp đang tuyển tại JOYWORK. Tìm môi trường làm việc phù hợp với bạn.";
const canonical = companiesListCanonical();

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: {
    title,
    description,
    url: canonical,
  },
  twitter: {
    title,
    description,
  },
};

export default function CompaniesListLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Breadcrumbs items={[{ name: "Trang chủ", href: "/" }, { name: "Doanh nghiệp" }]} />
      {children}
    </>
  );
}
