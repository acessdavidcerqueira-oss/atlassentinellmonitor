import type { NextConfig } from "next";

const nextConfig: NextConfig & { agentRules?: false } = {
  poweredByHeader: false,
  reactStrictMode: true,
  agentRules: false,
  typedRoutes: false
};

export default nextConfig;
