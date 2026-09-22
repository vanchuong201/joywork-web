import type { Metadata } from "next";
import HomeFeedPage from "./home-feed-page";
import { getPublicSiteUrl } from "@/lib/seo-url-metadata";

const title = "JOYWORK - Nơi Doanh Nghiệp Tốt Tuyển Dụng | Tìm việc tại công ty tốt";
const description =
  "JOYWORK - Nền tảng tuyển dụng của các doanh nghiệp tốt, có bộ lọc để tìm những doanh nghiệp đã qua khảo sát hoặc cam kết về điều kiện làm việc.";

const canonical = `${getPublicSiteUrl()}/`;

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

export default function HomePage() {
  return <HomeFeedPage />;
}
