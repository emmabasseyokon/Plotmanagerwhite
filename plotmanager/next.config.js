/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ]
    return [
      {
        // Public form pages — allow iframe embedding
        source: '/form/:path*',
        headers: securityHeaders,
      },
      {
        // Everything else — block iframe embedding
        source: '/:path*',
        headers: [
          ...securityHeaders,
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
