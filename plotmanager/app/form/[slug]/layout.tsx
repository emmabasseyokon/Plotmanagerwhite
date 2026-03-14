import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Land Subscription Form',
}

export default function FormLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <footer className="py-6 text-center">
        <p className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} All rights reserved.
        </p>
      </footer>
    </div>
  )
}
