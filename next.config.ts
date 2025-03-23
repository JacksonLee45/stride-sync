import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
    ANTHROPIC_COLLECTION_ID: process.env.ANTHROPIC_COLLECTION_ID || "",
  },
};

export default nextConfig;