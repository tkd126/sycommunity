import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "@ssabrojs/hwpxjs"],
};

export default nextConfig;
