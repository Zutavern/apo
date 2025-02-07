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
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    domains: [
      'rp-online.de',
      'www.mz.de',
      'www.welt.de',
      'www.faz.net',
      'www.zeit.de',
      'www.sueddeutsche.de',
      'www.stern.de',
      'www.focus.de',
      'www.tagesschau.de',
      'www.n-tv.de',
      'www.spiegel.de',
      'bilder.t-online.de',
      'images.zeit.de',
      'img.zeit.de',
      'www.mdr.de',
      'www.ndr.de'
    ],
    unoptimized: true
  },
  // Optimierte Asset-Präfetch-Konfiguration
  experimental: {
    optimizePackageImports: ['@/components'],
    optimizeCss: true
  }
}

module.exports = nextConfig 