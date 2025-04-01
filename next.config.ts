import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  output: "standalone",
  outputFileTracingIncludes: {
    "*": ["node_modules/**/*"],
  },
};

export default nextConfig;
