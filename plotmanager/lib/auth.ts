import { createClient } from '@/lib/supabase/server'

export interface UserProfile {
  userId: string
  email: string
  role: 'super_admin' | 'admin'
  companyId: string | null
  fullName: string
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id, full_name')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const typedProfile = profile as { role: string; company_id: string | null; full_name: string }

  return {
    userId: user.id,
    email: user.email || '',
    role: typedProfile.role as 'super_admin' | 'admin',
    companyId: typedProfile.company_id,
    fullName: typedProfile.full_name || '',
  }
}
