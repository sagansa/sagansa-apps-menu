/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/products/:path*',
        destination: '/storage/products/:path*',
      },
    ];
  },
}

module.exports = nextConfig
