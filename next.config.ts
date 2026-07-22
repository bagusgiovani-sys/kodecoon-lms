import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile above the project makes Next infer the wrong workspace
  // root — pin it so builds are stable regardless of sibling folders.
  turbopack: { root: __dirname },
};

export default nextConfig;
