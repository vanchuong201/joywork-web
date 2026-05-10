import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Noto_Serif } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import GoogleOneTap from "@/components/auth/GoogleOneTap";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

// Inter: Font hiện đại, hỗ trợ tốt tiếng Việt, phù hợp với ứng dụng doanh nghiệp
// Dùng cho UI elements: buttons, forms, navigation, headings
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  preload: true,
});

// Noto Serif: Font có chân, hỗ trợ tốt tiếng Việt
// Dùng cho nội dung dài: mô tả công ty, job description, bài viết
const notoSerif = Noto_Serif({
  variable: "--font-serif",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

// JetBrains Mono: Font monospace cho code, hỗ trợ tốt tiếng Việt
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_FRONTEND_ORIGIN ?? "https://joywork.vn";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "JOYWORK - Nơi doanh nghiệp tốt lên tiếng",
  description: "JOYWORK là nền tảng giúp các doanh nghiệp có môi trường làm việc tốt lên tiếng để kể câu chuyện thật về văn hóa doanh nghiệp, từ đó thu hút những nhân sự phù hợp về cả văn hóa và kỹ năng.",
  icons: {
    icon: [
      { url: "/JW-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/JW-32x32.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/JW-32x32.png",
    apple: "/JW-32x32.png",
  },
  openGraph: {
    type: "website",
    siteName: "JOYWORK",
    title: "JOYWORK - Nơi doanh nghiệp tốt lên tiếng",
    description: "JOYWORK là nền tảng giúp các doanh nghiệp có môi trường làm việc tốt lên tiếng để kể câu chuyện thật về văn hóa doanh nghiệp, từ đó thu hút những nhân sự phù hợp về cả văn hóa và kỹ năng.",
    images: [
      {
        url: "/og-share.jpg",
        width: 1200,
        height: 630,
        alt: "JOYWORK - Nơi doanh nghiệp tốt lên tiếng",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JOYWORK - Nơi doanh nghiệp tốt lên tiếng",
    description: "JOYWORK là nền tảng giúp các doanh nghiệp có môi trường làm việc tốt lên tiếng để kể câu chuyện thật về văn hóa doanh nghiệp, từ đó thu hút những nhân sự phù hợp về cả văn hóa và kỹ năng.",
    images: ["/og-share.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <body suppressHydrationWarning
        className={`${inter.variable} ${notoSerif.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[var(--background)] text-[var(--foreground)]`}
      >
        <Providers>
          {children}
          <GoogleOneTap />
          <GoogleAnalytics />
        </Providers>
      </body>
    </html>
  );
}
