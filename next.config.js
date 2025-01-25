/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pbpayybakxtpsrvbuhvm.supabase.co',
        pathname: '/storage/v1/**',
      },
    ],
  }
}

module.exports = nextConfig 