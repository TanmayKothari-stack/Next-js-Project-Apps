// next.config.mjs
import withPWA from "next-pwa";

const nextConfig = {
  reactCompiler: true,
  devIndicators: false,
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
