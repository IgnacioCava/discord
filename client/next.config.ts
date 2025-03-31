import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        // ("https://lh3.googleusercontent.com/a/ACg8ocIvqmdgsZ50s1y43edIN06opQfNWJv5AZqZdMlgQxqMdVLf2w=s96-c");
        protocol: "https",
        hostname: "*.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
