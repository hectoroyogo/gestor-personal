/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@gestor/core", "@gestor/db", "@gestor/api", "@gestor/ui-tokens"]
};

export default nextConfig;

