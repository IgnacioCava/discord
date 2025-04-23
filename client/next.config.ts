import type { NextConfig } from "next";
import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";
const withVanillaExtract = createVanillaExtractPlugin({
  identifiers: 'debug',
});

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

export default withVanillaExtract(nextConfig);
