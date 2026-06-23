import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-f66ad83430274d9284d9172bc855e8cd.r2.dev",
      },
    ],
  },
};

export default nextConfig;