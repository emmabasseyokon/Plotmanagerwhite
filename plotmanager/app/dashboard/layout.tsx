import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/Sidebar'
import type { Tables } from '@/types/database.types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const typedProfile = profile as Tables<'profiles'>

  if (!typedProfile.company_id) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userRole={typedProfile.role as 'super_admin' | 'admin'}
        userName={typedProfile.full_name}
      />
      <main className="flex-1 lg:ml-0">
        <div className="p-6 lg:p-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}
