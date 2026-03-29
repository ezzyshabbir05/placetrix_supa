import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    devIndicators: false,
    experimental: {
        useCache: true,
    }
};

export default nextConfig;
