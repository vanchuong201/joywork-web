import type { Metadata } from "next";
import type { ReactNode } from "react";

/** Danh sách và chi tiết khóa học vẫn truy cập được, nhưng không đưa vào index. */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function CoursesLayout({ children }: { children: ReactNode }) {
  return children;
}
