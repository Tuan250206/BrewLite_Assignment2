import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir:
    process.env.BREWLITE_E2E === 'real'
      ? '.next-e2e-real'
      : process.env.BREWLITE_E2E === 'true'
        ? '.next-e2e'
        : '.next',
};

export default nextConfig;
