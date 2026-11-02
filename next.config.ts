import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets e2e tests build into their own folder while `npm run dev` is running.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
