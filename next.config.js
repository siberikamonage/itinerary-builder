/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export' removed — Vercel handles Next.js natively and we need
  // API routes for the Notion export proxy.
  images: { unoptimized: true },
}

module.exports = nextConfig
