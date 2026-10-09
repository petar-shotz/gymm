import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "*.run.app",
    "ais-dev-vdqp3dplhckm6ez2we4jgq-547485829363.europe-west2.run.app",
    "ais-pre-vdqp3dplhckm6ez2we4jgq-547485829363.europe-west2.run.app",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
