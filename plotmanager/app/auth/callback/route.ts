import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  // Whitelist only safe internal paths to prevent open redirect
  const rawNext = requestUrl.searchParams.get('next') ?? '/dashboard'
  const next = rawNext.startsWith('/dashboard') || rawNext === '/reset-password' ? rawNext : '/dashboard'

  const errorDescription = requestUrl.searchParams.get('error_description') || ''
  if (errorDescription) {
    const loginUrl = new URL('/login', requestUrl.origin)
    // Map raw error descriptions to safe error codes to prevent XSS
    const errorCode = errorDescription.toLowerCase().includes('invalid')
      ? 'invalid_credentials'
      : errorDescription.toLowerCase().includes('confirm')
        ? 'email_not_confirmed'
        : errorDescription.toLowerCase().includes('expired')
          ? 'session_expired'
          : 'access_denied'
    loginUrl.searchParams.set('error', errorCode)
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
    loginUrl.searchParams.set('error', 'access_denied')
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
