import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import GoogleOneTap from "@/components/auth/GoogleOneTap";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JoyWork",
  description: "Nền tảng kết nối doanh nghiệp và ứng viên",
  icons: {
    icon: [
      { url: "/JW-1x1-small.png", type: "image/png" },
    ],
    shortcut: "/JW-1x1-small.png",
    apple: "/JW-1x1-small.png",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`}
      >
        <Providers>
          {children}
          <GoogleOneTap />
        </Providers>
      </body>
    </html>
  );
}
