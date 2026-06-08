import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];

    return {
      beforeFiles: [
        { source: "/api/vectors", destination: "http://localhost:8001" },
      ],
    };
  },
};

export default nextConfig;
