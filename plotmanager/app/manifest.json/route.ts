import { NextResponse } from 'next/server'

export async function GET() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PlotManager'
  const themeColor = process.env.NEXT_PUBLIC_THEME_COLOR || '#059669'

  const manifest = {
    name: appName,
    short_name: appName,
    description: `${appName} - Land buyers management made simple`,
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: themeColor,
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  })
}
