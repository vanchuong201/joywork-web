import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Noto_Serif } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import GoogleOneTap from "@/components/auth/GoogleOneTap";

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

export const metadata: Metadata = {
  title: "JoyWork",
  description: "Nền tảng kết nối doanh nghiệp và ứng viên",
  icons: {
    icon: [
      { url: "/JW-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/JW-32x32.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/JW-32x32.png",
    apple: "/JW-32x32.png",
  },
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
        </Providers>
      </body>
    </html>
  );
}
