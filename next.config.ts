import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Required for MP3 uploads in lesson creation
    },
    middlewareClientMaxBodySize: "10mb", // When middleware runs, body is buffered
  },
};

export default nextConfig;
