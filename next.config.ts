import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      {
        source: "/products/:path*",
        destination: "/storage/products/:path*",
      },
    ];
  },
};

export default nextConfig;
