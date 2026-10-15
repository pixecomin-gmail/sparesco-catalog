import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "products.sparesco.com",
          },
        ],
        destination: "/new/admin/products",
      },
    ];
  },
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