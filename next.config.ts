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
    async redirects() {
    return [
      {
        source: "/new",
        destination: "/new/admin/products",
        permanent: false,
      },
      {
        source: "/new/search",
        destination: "/new/admin/products",
        permanent: false,
      },
      {
        source: "/new/collections",
        destination: "/new/admin/products",
        permanent: false,
      },
      {
        source: "/new/collections/:handle",
        destination: "/new/admin/products",
        permanent: false,
      },
      {
        source: "/new/products/:handle",
        destination: "/new/admin/products",
        permanent: false,
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