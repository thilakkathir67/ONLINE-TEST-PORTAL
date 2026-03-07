/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    const apiTarget = process.env.INTERNAL_API_BASE || "http://127.0.0.1:5000";
    return [
      {
        source: "/backend/:path*",
        destination: `${apiTarget}/:path*`,
      },
    ];
  },
  onDemandEntries: {
    // Keep compiled pages alive longer in dev to avoid recompile on quick revisits.
    maxInactiveAge: 25 * 60 * 1000,
    pagesBufferLength: 10,
  },
};
module.exports = nextConfig;
