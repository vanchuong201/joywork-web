import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // Disable ESLint during builds in Docker
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds (only for Docker, should be fixed properly)
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "joywork-media.s3.ap-southeast-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
