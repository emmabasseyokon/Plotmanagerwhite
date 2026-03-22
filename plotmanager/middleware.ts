import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Allow iframe embedding for public form pages only
  if (!request.nextUrl.pathname.startsWith('/form')) {
    response.headers.set('X-Frame-Options', 'DENY')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|icons|favicon.ico).*)'],
}
