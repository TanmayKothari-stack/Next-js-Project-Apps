import pwa from "next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  devIndicators: false,
  // Disable Turbopack to use webpack
  turbopack: {}, // empty object, required by Next.js 16
};

const withPWA = pwa({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/middleware-manifest\.json$/],
});

export default withPWA(nextConfig);
