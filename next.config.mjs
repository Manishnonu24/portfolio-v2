import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.resolve("."),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ninagashi.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ninagashi.s3-eu-central-2.ionoscloud.com",
        port: "",
        pathname: "/**",
      },
    ],
    qualities: [75, 80],
  },
};

export default nextConfig;
