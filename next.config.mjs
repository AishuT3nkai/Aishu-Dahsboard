/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This repository is standalone: package.json and app/ are at its root.
  // Keep the default Node server output because OAuth and bridge API routes
  // require a server runtime (a static export would not work).
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
