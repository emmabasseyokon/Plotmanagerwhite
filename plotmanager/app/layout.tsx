import type { Metadata } from 'next'
import { DM_Sans, Poppins } from 'next/font/google'
import './globals.css'
import { ToastContainer } from '@/components/ui/Toast'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const poppins = Poppins({
  weight: ['600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export function generateMetadata(): Metadata {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PlotManager'
  const themeColor = process.env.NEXT_PUBLIC_THEME_COLOR || '#059669'
  return {
    title: `${appName} - Land Buyers Management`,
    description: 'Manage land buyers, track payments, and send reminders',
    manifest: '/manifest.json',
    themeColor,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: appName,
    },
    formatDetection: {
      telephone: false,
    },
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${poppins.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-body antialiased bg-gray-50">
        {children}
        <ToastContainer />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
