/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for Cloudflare Workers static assets. Security headers live
  // in public/_headers and redirects in out/_redirects (scripts/finish-export.ts);
  // signups go through the Worker in worker/index.ts.
  output: "export",
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
