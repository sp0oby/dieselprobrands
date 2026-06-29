import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/returns", destination: "/returns-warranty", permanent: true },
      { source: "/register", destination: "/sign-up", permanent: true },
      { source: "/login", destination: "/sign-in", permanent: true },
      { source: "/signup", destination: "/sign-up", permanent: true },
      { source: "/signin", destination: "/sign-in", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "media.fridayparts.com" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "www.fabheavyparts.com" },
      { protocol: "https", hostname: "www.tamerx.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
    formats: ["image/webp"],
  },
};

export default config;
