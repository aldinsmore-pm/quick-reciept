import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js", "tesseract.js-core", "sharp"],
};

export default nextConfig;
