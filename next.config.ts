import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  serverExternalPackages: [
    "langchain",
    "@langchain/core",
    "@langchain/openai",
    "@langchain/community",
    "@langchain/textsplitters",
  ],
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
