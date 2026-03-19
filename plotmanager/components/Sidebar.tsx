'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, UserCog, LogOut, Menu, X, MapPin, MessageCircle, Building, Bell, Settings, UserCheck, BarChart3, ScrollText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface SidebarProps {
  userRole: 'super_admin' | 'admin'
  userName: string
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'PlotManager'

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Estates', href: '/dashboard/estates', icon: Building },
    { name: 'Buyers', href: '/dashboard/buyers', icon: Users },
    { name: 'Agents', href: '/dashboard/agents', icon: UserCheck },
    { name: 'Reminders', href: '/dashboard/reminders', icon: Bell },
    ...(userRole === 'super_admin'
      ? [
          { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
          { name: 'Admins', href: '/dashboard/admins', icon: UserCog },
          { name: 'Activity Logs', href: '/dashboard/activity-logs', icon: ScrollText },
          { name: 'Settings', href: '/dashboard/settings/form', icon: Settings },
        ]
      : []),
  ]

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-display font-bold text-lg text-gray-900">{appName}</h2>
            <p className="text-xs text-gray-500 capitalize">{userRole.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all',
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-2">
        <div className="px-4 py-3 bg-gray-50 rounded-xl">
          <p className="text-sm font-medium text-gray-900">{userName}</p>
          <p className="text-xs text-gray-500 mt-1">Signed in</p>
        </div>
        <a
          href={`https://wa.me/2349094579266?text=${encodeURIComponent(`Hi, I need help with ${appName}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-green-700 hover:bg-green-50 transition-all"
        >
          <MessageCircle className="w-5 h-5" />
          Need help? Chat with us
        </a>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign out
        </Button>
      </div>
    </>
  )

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className="hidden lg:flex lg:flex-col lg:w-72 bg-white border-r border-gray-200 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 z-40 w-72 bg-white h-screen flex flex-col transition-transform duration-300',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
