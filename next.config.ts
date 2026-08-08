import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output is only for the Docker build (see Dockerfile).
  // Vercel's build never sets DOCKER_BUILD, so its output is unchanged.
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  images: {
    remotePatterns: [
      { hostname: "utfs.io" },
      { hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
