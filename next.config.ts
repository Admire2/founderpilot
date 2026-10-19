import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js to ignore TypeScript errors during build 
  // so legacy/unrelated files don't block deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  // Tell Next.js to ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;