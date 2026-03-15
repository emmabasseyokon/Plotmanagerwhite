import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  // Whitelist only safe internal paths to prevent open redirect
  const SAFE_PATHS = ['/dashboard', '/dashboard/estates', '/dashboard/buyers', '/dashboard/reminders', '/dashboard/admins', '/dashboard/settings/form']
  const rawNext = requestUrl.searchParams.get('next') ?? '/dashboard'
  const next = SAFE_PATHS.includes(rawNext) ? rawNext : '/dashboard'

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

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    const loginUrl = new URL('/login', requestUrl.origin)
    loginUrl.searchParams.set('error', error.message)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
