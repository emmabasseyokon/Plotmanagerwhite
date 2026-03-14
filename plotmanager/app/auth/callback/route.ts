import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { APP_COMPANY_ID } from '@/lib/config'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const rawNext = requestUrl.searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard'

  const errorDescription = requestUrl.searchParams.get('error_description')
  if (errorDescription) {
    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', errorDescription)
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()

        // Auto-create profile if it doesn't exist
        if (!profile && APP_COMPANY_ID) {
          const admin = createAdminClient()
          await admin.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email!,
            full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Admin',
            role: 'admin',
            company_id: APP_COMPANY_ID,
          })
        }
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', error.message)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
