import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    devIndicators: false,
    cacheComponents: true,
    experimental: {
        useCache: true,
    }
};

export default nextConfig;
