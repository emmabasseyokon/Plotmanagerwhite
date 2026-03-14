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

export const metadata: Metadata = {
  title: 'PlotManager - Land Buyers Management',
  description: 'Manage land buyers, track payments, and send reminders',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${poppins.variable}`}>
      <body className="font-body antialiased bg-gray-50">
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
