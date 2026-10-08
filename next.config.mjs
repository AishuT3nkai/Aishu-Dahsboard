/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The dashboard is deployed with "Root Directory: dashboard" on Vercel,
  // per the bot repo README. Keep output as the default Node server (not
  // "export") because API routes need a server runtime for OAuth + the bot bridge.
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
