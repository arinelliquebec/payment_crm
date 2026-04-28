import type { NextConfig } from "next";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const frontendRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.join(frontendRoot, "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
